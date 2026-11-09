const AmenitySubscription = require('../models/amenitySubscription.model');
const MaintenanceInvoice = require('../models/maintenanceInvoice.model');
const AmenityEntryLog = require('../models/amenityEntryLog.model');
const Amenity = require('../models/amenity.model');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { generateQrToken, verifyQrToken } = require('../utils/qrToken');
const {
  AMENITY_ACCESS_STATUS,
  AMENITY_VERIFICATION_RESULT,
  MAINTENANCE_STATUS,
  SUBSCRIPTION_STATUS
} = require('../constants/statuses');
const { recordAuditLog } = require('../middlewares/audit.middleware');

/**
 * Check if a flat has any outstanding unpaid/overdue maintenance bills
 */
const hasUnpaidMaintenance = async (flatId) => {
  if (!flatId) return false;
  const count = await MaintenanceInvoice.countDocuments({
    flat: flatId,
    status: { $in: [MAINTENANCE_STATUS.UNPAID, MAINTENANCE_STATUS.OVERDUE] }
  });
  return count > 0;
};

/**
 * Get Digital Amenity Access Card for an owner and amenity
 */
const getOwnerAmenityCard = async (ownerUser, amenityId) => {
  const amenity = await Amenity.findById(amenityId);
  if (!amenity) {
    throw AppError.notFound('Amenity not found');
  }

  // Find active subscription for user
  const now = new Date();
  const subscription = await AmenitySubscription.findOne({
    user: ownerUser._id,
    amenity: amenity._id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).sort({ endDate: -1 });

  const unpaidDuesExist = await hasUnpaidMaintenance(ownerUser.flat?._id || ownerUser.flat);

  let status = AMENITY_ACCESS_STATUS.RED;
  let statusReason = 'No active subscription found';

  if (subscription) {
    if (unpaidDuesExist) {
      status = AMENITY_ACCESS_STATUS.RED;
      statusReason = 'Access restricted due to unpaid society maintenance invoices.';
    } else {
      status = AMENITY_ACCESS_STATUS.GREEN;
      statusReason = 'Subscription active and all maintenance dues cleared.';
    }
  }

  // Generate tamper-resistant signed QR verification token if subscription exists
  let qrToken = null;
  if (subscription) {
    qrToken = generateQrToken({
      subscriptionId: subscription._id,
      userId: ownerUser._id,
      amenityId: amenity._id
    });
  }

  return {
    owner: {
      name: ownerUser.name,
      email: ownerUser.email,
      phone: ownerUser.phone,
      tower: ownerUser.flat?.tower || 'N/A',
      flatNumber: ownerUser.flat?.flatNumber || 'N/A'
    },
    amenity: {
      id: amenity._id,
      name: amenity.name
    },
    subscription: subscription
      ? {
          id: subscription._id,
          planId: subscription.planId,
          planName: subscription.planName,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        }
      : null,
    accessStatus: status,
    statusReason,
    unpaidMaintenanceDues: unpaidDuesExist,
    qrToken
  };
};

/**
 * Guard verifies amenity card by QR token
 */
const verifyAmenityCardToken = async (qrToken, guardUser) => {
  const decoded = verifyQrToken(qrToken);

  const [subscription, user, amenity] = await Promise.all([
    AmenitySubscription.findById(decoded.subId).populate('flat'),
    User.findById(decoded.uid).populate('flat'),
    Amenity.findById(decoded.aid)
  ]);

  if (!subscription || !user || !amenity) {
    throw AppError.notFound('Verification entity records not found');
  }

  const now = new Date();
  const isSubscriptionValid =
    subscription.status === SUBSCRIPTION_STATUS.ACTIVE &&
    subscription.startDate <= now &&
    subscription.endDate >= now;

  const unpaidDuesExist = await hasUnpaidMaintenance(user.flat?._id || subscription.flat?._id);

  let verificationResult = AMENITY_VERIFICATION_RESULT.DENIED;
  let accessStatus = AMENITY_ACCESS_STATUS.RED;
  let reason = '';

  if (!isSubscriptionValid) {
    reason = 'Subscription has expired or is inactive';
  } else if (unpaidDuesExist) {
    reason = 'Unpaid maintenance dues pending for this resident flat';
  } else {
    verificationResult = AMENITY_VERIFICATION_RESULT.ALLOWED;
    accessStatus = AMENITY_ACCESS_STATUS.GREEN;
    reason = 'Access granted: Active subscription and maintenance dues clear';
  }

  // Create entry verification audit log in MongoDB
  await AmenityEntryLog.create({
    user: user._id,
    flat: user.flat?._id || subscription.flat?._id,
    amenity: amenity._id,
    subscription: subscription._id,
    guard: guardUser._id,
    verificationResult,
    reason
  });

  return {
    accessStatus,
    verificationResult,
    reason,
    resident: {
      name: user.name,
      tower: user.flat?.tower,
      flatNumber: user.flat?.flatNumber
    },
    amenity: amenity.name,
    subscriptionExpiry: subscription.endDate
  };
};

/**
 * Admin override for amenity access (Mandatory reason + audit trail)
 */
const adminOverrideAccess = async ({ userId, amenityId, overrideReason }, adminUser) => {
  const [user, amenity] = await Promise.all([
    User.findById(userId).populate('flat'),
    Amenity.findById(amenityId)
  ]);

  if (!user || !amenity) {
    throw AppError.notFound('User or Amenity not found');
  }

  await AmenityEntryLog.create({
    user: user._id,
    flat: user.flat?._id,
    amenity: amenity._id,
    guard: adminUser._id,
    verificationResult: AMENITY_VERIFICATION_RESULT.ADMIN_OVERRIDE,
    reason: `Admin override granted: ${overrideReason}`,
    adminOverrideBy: adminUser._id,
    overrideReason
  });

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'ADMIN_OVERRIDE_AMENITY_ACCESS',
    resourceType: 'AmenityEntryLog',
    resourceId: amenity._id,
    details: { userId: user._id, residentName: user.name, overrideReason }
  });

  return {
    success: true,
    message: 'Administrative override granted successfully',
    accessStatus: AMENITY_ACCESS_STATUS.GREEN
  };
};

/**
 * Get entry logs for security / admin
 */
const getEntryLogs = async ({ amenityId, page = 1, limit = 20 }) => {
  const query = {};
  if (amenityId) query.amenity = amenityId;

  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AmenityEntryLog.find(query)
      .populate('user', 'name email phone')
      .populate('flat', 'tower flatNumber')
      .populate('amenity', 'name')
      .populate('guard', 'name role')
      .populate('adminOverrideBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AmenityEntryLog.countDocuments(query)
  ]);

  return {
    items: logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  hasUnpaidMaintenance,
  getOwnerAmenityCard,
  verifyAmenityCardToken,
  adminOverrideAccess,
  getEntryLogs
};
