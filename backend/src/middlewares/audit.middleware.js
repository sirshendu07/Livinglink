const AuditLog = require('../models/auditLog.model');
const logger = require('../config/logger');

/**
 * Record an audit event
 */
const recordAuditLog = async ({ actor, actorRole, action, resourceType, resourceId, ipAddress, details }) => {
  try {
    await AuditLog.create({
      actor: actor || null,
      actorRole: actorRole || 'SYSTEM',
      action,
      resourceType,
      resourceId: resourceId ? resourceId.toString() : null,
      ipAddress: ipAddress || null,
      details: details || {}
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to write audit log entry');
  }
};

module.exports = {
  recordAuditLog
};
