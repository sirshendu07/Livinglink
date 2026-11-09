const User = require('../models/user.model');
const Flat = require('../models/flat.model');
const AppError = require('../utils/appError');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/statuses');
const { hashPassword } = require('../utils/crypto.utils');
const { recordAuditLog } = require('../middlewares/audit.middleware');
const { createNotification } = require('./notification.service');

/**
 * Admin creates staff accounts (ADMIN or SECURITY only)
 */
const createStaffAccount = async ({ name, email, phone, password, role }, adminUser) => {
  if (role !== ROLES.ADMIN && role !== ROLES.SECURITY) {
    throw AppError.badRequest('Only ADMIN and SECURITY roles can be created via staff management.');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw AppError.conflict('An account with this email already exists.');
  }

  const hashedPassword = await hashPassword(password);
  const staff = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    role,
    flat: null,
    isEmailVerified: true,
    status: USER_STATUS.ACTIVE,
    approvedBy: adminUser._id,
    approvedAt: new Date()
  });

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'CREATE_STAFF_ACCOUNT',
    resourceType: 'User',
    resourceId: staff._id,
    details: { email: staff.email, role: staff.role }
  });

  return staff;
};

/**
 * Admin approves an owner registration
 */
const approveOwnerAccount = async (ownerId, adminUser) => {
  const user = await User.findById(ownerId).populate('flat');
  if (!user) {
    throw AppError.notFound('Owner account not found.');
  }

  if (user.role !== ROLES.OWNER) {
    throw AppError.badRequest('Only OWNER accounts require approval.');
  }

  user.status = USER_STATUS.ACTIVE;
  user.approvedBy = adminUser._id;
  user.approvedAt = new Date();
  await user.save();

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'APPROVE_OWNER_ACCOUNT',
    resourceType: 'User',
    resourceId: user._id,
    details: { email: user.email, flat: user.flat }
  });

  // Notify the owner
  await createNotification({
    recipient: user._id,
    type: 'ACCOUNT_APPROVED',
    title: 'Membership Approved',
    message: 'Your LivingLink society membership has been approved. You can now access society services.'
  });

  return user;
};

/**
 * Admin rejects / suspends / deactivates an account
 */
const updateUserStatus = async (userId, status, adminUser, reason = '') => {
  if (!Object.values(USER_STATUS).includes(status)) {
    throw AppError.badRequest('Invalid status');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw AppError.notFound('User not found.');
  }

  user.status = status;
  await user.save();

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'UPDATE_USER_STATUS',
    resourceType: 'User',
    resourceId: user._id,
    details: { status, reason }
  });

  return user;
};

/**
 * Get all users with filters and pagination
 */
const getAllUsers = async ({ role, status, search, page = 1, limit = 20 }) => {
  const query = {};
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(query).populate('flat').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(query)
  ]);

  return {
    items: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Get all flats with their residents
 */
const getAllFlats = async ({ tower, page = 1, limit = 50 }) => {
  const query = {};
  if (tower) query.tower = tower.trim().toUpperCase();

  const skip = (page - 1) * limit;
  const [flats, total] = await Promise.all([
    Flat.find(query)
      .populate('residents', 'name email phone role status')
      .sort({ tower: 1, flatNumber: 1 })
      .skip(skip)
      .limit(limit),
    Flat.countDocuments(query)
  ]);

  return {
    items: flats,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  createStaffAccount,
  approveOwnerAccount,
  updateUserStatus,
  getAllUsers,
  getAllFlats
};
