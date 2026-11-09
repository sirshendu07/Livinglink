const crypto = require('crypto');
const SosAlert = require('../models/sosAlert.model');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { SOS_STATUS } = require('../constants/statuses');
const { ROLES } = require('../constants/roles');
const { emitToRole, emitToAll } = require('../sockets/socketEmitter');
const { createNotification } = require('./notification.service');
const { cacheService } = require('../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../constants/cacheKeys');
const { recordAuditLog } = require('../middlewares/audit.middleware');

/**
 * Generate unique SOS code
 */
const generateSosCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SOS-${dateStr}-${randomSuffix}`;
};

/**
 * Trigger SOS alert
 */
const triggerSos = async (notes, user) => {
  // Duplicate-trigger protection: 10s cooldown
  const cooldownKey = `${CACHE_KEYS.SOS_COOLDOWN_PREFIX}${user._id.toString()}`;
  const isCooldown = await cacheService.exists(cooldownKey);
  if (isCooldown) {
    throw AppError.badRequest('An active emergency alert was just initiated. Help is being dispatched.');
  }

  await cacheService.set(cooldownKey, '1', CACHE_TTL.SOS_COOLDOWN);

  const sosCode = generateSosCode();

  const sos = await SosAlert.create({
    sosCode,
    user: user._id,
    userRole: user.role,
    flat: user.flat?._id || user.flat || null,
    status: SOS_STATUS.ACTIVE,
    notes: notes || 'Emergency assistance requested immediately!'
  });

  const populatedSos = await SosAlert.findById(sos._id)
    .populate('user', 'name phone email role')
    .populate('flat', 'tower flatNumber')
    .lean();

  // Real-time broadcast to Security and Admin rooms
  emitToRole(ROLES.SECURITY, 'sos:alert:triggered', populatedSos);
  emitToRole(ROLES.ADMIN, 'sos:alert:triggered', populatedSos);
  // Also emit to society feed room for high-visibility if needed
  emitToAll('sos:broadcast', {
    sosCode: sos.sosCode,
    location: populatedSos.flat ? `${populatedSos.flat.tower}-${populatedSos.flat.flatNumber}` : 'Society Premises',
    triggeredAt: sos.createdAt
  });

  // Persist notifications for all guards and admins
  const recipients = await User.find({
    role: { $in: [ROLES.SECURITY, ROLES.ADMIN] },
    status: 'ACTIVE'
  }).select('_id');

  const alertMessage = populatedSos.flat
    ? `EMERGENCY ALERT: Triggered by ${user.name} at Flat ${populatedSos.flat.tower}-${populatedSos.flat.flatNumber}!`
    : `EMERGENCY ALERT: Triggered by ${user.name} (${user.role})!`;

  for (const staff of recipients) {
    createNotification({
      recipient: staff._id,
      type: 'SOS_EMERGENCY',
      title: 'CRITICAL EMERGENCY SOS',
      message: alertMessage,
      data: { sosId: sos._id, sosCode: sos.sosCode }
    }).catch(() => {});
  }

  await recordAuditLog({
    actor: user._id,
    actorRole: user.role,
    action: 'TRIGGER_SOS_ALERT',
    resourceType: 'SosAlert',
    resourceId: sos._id,
    details: { sosCode: sos.sosCode, location: populatedSos.flat }
  });

  return populatedSos;
};

/**
 * Security guard or Admin acknowledges an active SOS alert
 */
const acknowledgeSos = async (sosId, notes, respondingUser) => {
  const sos = await SosAlert.findById(sosId);
  if (!sos) {
    throw AppError.notFound('SOS alert not found');
  }

  if (sos.status !== SOS_STATUS.ACTIVE) {
    throw AppError.badRequest(`Cannot acknowledge: Alert status is currently ${sos.status}`);
  }

  sos.status = SOS_STATUS.ACKNOWLEDGED;
  sos.acknowledgedBy = respondingUser._id;
  sos.acknowledgedAt = new Date();
  if (notes) {
    sos.notes = `${sos.notes} | Acknowledged Note: ${notes}`;
  }
  await sos.save();

  const populatedSos = await SosAlert.findById(sos._id)
    .populate('user', 'name phone')
    .populate('flat', 'tower flatNumber')
    .populate('acknowledgedBy', 'name role')
    .lean();

  emitToRole(ROLES.SECURITY, 'sos:alert:acknowledged', populatedSos);
  emitToRole(ROLES.ADMIN, 'sos:alert:acknowledged', populatedSos);

  return populatedSos;
};

/**
 * Admin resolves or closes an SOS alert
 */
const resolveSos = async (sosId, resolutionNotes, adminUser) => {
  const sos = await SosAlert.findById(sosId);
  if (!sos) {
    throw AppError.notFound('SOS alert not found');
  }

  sos.status = SOS_STATUS.RESOLVED;
  sos.resolvedBy = adminUser._id;
  sos.resolvedAt = new Date();
  sos.resolutionNotes = resolutionNotes;
  await sos.save();

  const populatedSos = await SosAlert.findById(sos._id)
    .populate('user', 'name phone')
    .populate('flat', 'tower flatNumber')
    .populate('resolvedBy', 'name role')
    .lean();

  emitToRole(ROLES.SECURITY, 'sos:alert:resolved', populatedSos);
  emitToRole(ROLES.ADMIN, 'sos:alert:resolved', populatedSos);

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'RESOLVE_SOS_ALERT',
    resourceType: 'SosAlert',
    resourceId: sos._id,
    details: { sosCode: sos.sosCode, resolutionNotes }
  });

  return populatedSos;
};

/**
 * Get active SOS alerts (for guards and admins)
 */
const getActiveAlerts = async () => {
  return SosAlert.find({
    status: { $in: [SOS_STATUS.ACTIVE, SOS_STATUS.ACKNOWLEDGED] }
  })
    .populate('user', 'name phone role')
    .populate('flat', 'tower flatNumber')
    .populate('acknowledgedBy', 'name role')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get paginated alert history
 */
const getSosHistory = async ({ status, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [alerts, total] = await Promise.all([
    SosAlert.find(query)
      .populate('user', 'name phone role')
      .populate('flat', 'tower flatNumber')
      .populate('acknowledgedBy', 'name role')
      .populate('resolvedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SosAlert.countDocuments(query)
  ]);

  return {
    items: alerts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  triggerSos,
  acknowledgeSos,
  resolveSos,
  getActiveAlerts,
  getSosHistory
};
