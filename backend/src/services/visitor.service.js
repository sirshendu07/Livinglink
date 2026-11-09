const crypto = require('crypto');
const VisitorRequest = require('../models/visitorRequest.model');
const Flat = require('../models/flat.model');
const AppError = require('../utils/appError');
const { VISITOR_STATUS } = require('../constants/statuses');
const { ROLES } = require('../constants/roles');
const { emitToRole, emitToUser } = require('../sockets/socketEmitter');
const { createNotification } = require('./notification.service');
const { recordAuditLog } = require('../middlewares/audit.middleware');

/**
 * Generate unique visitor code
 */
const generateVisitorCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `VIS-${dateStr}-${randomSuffix}`;
};

/**
 * Security guard creates visitor entry request at gate
 */
const createVisitorRequest = async (data, guardUser) => {
  const normalizedTower = data.tower.trim().toUpperCase();
  const normalizedFlatNumber = data.flatNumber.trim().toUpperCase();

  const flat = await Flat.findOne({
    tower: normalizedTower,
    flatNumber: normalizedFlatNumber
  }).populate('residents');

  if (!flat) {
    throw AppError.notFound(`Destination Flat ${normalizedTower}-${normalizedFlatNumber} does not exist.`);
  }

  const visitorCode = generateVisitorCode();
  // Request expires automatically after 30 minutes if not approved
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const request = await VisitorRequest.create({
    visitorCode,
    visitorName: data.visitorName.trim(),
    visitorPhone: data.visitorPhone.trim(),
    destinationFlat: flat._id,
    category: data.category,
    purpose: data.purpose || 'General Visit',
    vehicleNumber: data.vehicleNumber ? data.vehicleNumber.trim().toUpperCase() : null,
    photoUrl: data.photoUrl || null,
    status: VISITOR_STATUS.PENDING,
    createdGuard: guardUser._id,
    expiresAt
  });

  const populatedRequest = await VisitorRequest.findById(request._id)
    .populate('destinationFlat', 'tower flatNumber')
    .populate('createdGuard', 'name role')
    .lean();

  // Notify flat residents in real-time
  if (flat.residents && flat.residents.length > 0) {
    for (const resident of flat.residents) {
      // Socket real-time event
      emitToUser(resident._id, 'visitor:approval:request', populatedRequest);

      // Persistent notification
      createNotification({
        recipient: resident._id,
        type: 'VISITOR_APPROVAL_REQUEST',
        title: 'Visitor at Gate',
        message: `${data.visitorName} (${data.category.replace('_', ' ')}) is at the gate requesting entry to your flat.`,
        data: { visitorId: request._id, visitorCode }
      }).catch(() => {});
    }
  }

  return populatedRequest;
};

/**
 * Owner approves or rejects visitor request
 */
const respondToVisitorRequest = async (requestId, { decision, rejectionReason }, ownerUser) => {
  const request = await VisitorRequest.findById(requestId).populate('destinationFlat');
  if (!request) {
    throw AppError.notFound('Visitor request not found');
  }

  // Ensure owner belongs to the destination flat
  const ownerFlatId = (ownerUser.flat?._id || ownerUser.flat).toString();
  const destFlatId = request.destinationFlat._id.toString();

  if (ownerFlatId !== destFlatId) {
    throw AppError.forbidden('You can only approve or reject visitors for your own flat');
  }

  if (request.status !== VISITOR_STATUS.PENDING) {
    throw AppError.badRequest(`Cannot respond: Request is already marked as ${request.status}`);
  }

  if (request.expiresAt && request.expiresAt < new Date()) {
    request.status = VISITOR_STATUS.EXPIRED;
    await request.save();
    throw AppError.badRequest('This visitor request has expired');
  }

  if (decision === 'APPROVE') {
    request.status = VISITOR_STATUS.APPROVED;
    request.approvedBy = ownerUser._id;
    request.approvedAt = new Date();
  } else {
    request.status = VISITOR_STATUS.REJECTED;
    request.rejectionReason = rejectionReason || 'Rejected by resident';
  }

  await request.save();

  const updatedRequest = await VisitorRequest.findById(request._id)
    .populate('destinationFlat', 'tower flatNumber')
    .populate('approvedBy', 'name')
    .lean();

  // Notify security guards in real-time
  emitToRole(ROLES.SECURITY, 'visitor:decision:updated', updatedRequest);

  return updatedRequest;
};

/**
 * Guard marks approved visitor as entered
 */
const markVisitorEntered = async (requestId, guardUser) => {
  const request = await VisitorRequest.findById(requestId).populate('destinationFlat');
  if (!request) {
    throw AppError.notFound('Visitor request not found');
  }

  if (request.status !== VISITOR_STATUS.APPROVED) {
    throw AppError.badRequest(`Entry denied: Visitor request status is ${request.status}. Only APPROVED visitors can enter.`);
  }

  request.status = VISITOR_STATUS.ENTERED;
  request.entryTimestamp = new Date();
  request.entryGuard = guardUser._id;
  await request.save();

  emitToRole(ROLES.SECURITY, 'visitor:status:entered', {
    requestId: request._id,
    visitorCode: request.visitorCode,
    entryTimestamp: request.entryTimestamp
  });

  return request;
};

/**
 * Guard marks entered visitor as exited
 */
const markVisitorExited = async (requestId, guardUser) => {
  const request = await VisitorRequest.findById(requestId);
  if (!request) {
    throw AppError.notFound('Visitor request not found');
  }

  if (request.status !== VISITOR_STATUS.ENTERED) {
    throw AppError.badRequest(`Cannot record exit: Visitor is not currently inside (status: ${request.status})`);
  }

  request.status = VISITOR_STATUS.EXITED;
  request.exitTimestamp = new Date();
  request.exitGuard = guardUser._id;
  await request.save();

  emitToRole(ROLES.SECURITY, 'visitor:status:exited', {
    requestId: request._id,
    visitorCode: request.visitorCode,
    exitTimestamp: request.exitTimestamp
  });

  return request;
};

/**
 * Admin emergency override for visitor entry
 */
const adminOverrideVisitorEntry = async (requestId, reason, adminUser) => {
  const request = await VisitorRequest.findById(requestId).populate('destinationFlat');
  if (!request) {
    throw AppError.notFound('Visitor request not found');
  }

  request.status = VISITOR_STATUS.APPROVED;
  request.approvedBy = adminUser._id;
  request.approvedAt = new Date();
  request.purpose = `${request.purpose || ''} [ADMIN OVERRIDE: ${reason}]`;
  await request.save();

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'ADMIN_OVERRIDE_VISITOR_APPROVAL',
    resourceType: 'VisitorRequest',
    resourceId: request._id,
    details: { visitorCode: request.visitorCode, reason }
  });

  emitToRole(ROLES.SECURITY, 'visitor:decision:updated', request);
  return request;
};

/**
 * Get visitor requests for owner's flat
 */
const getOwnerVisitorRequests = async (flatId, { status, page = 1, limit = 20 }) => {
  const query = { destinationFlat: flatId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    VisitorRequest.find(query)
      .populate('destinationFlat', 'tower flatNumber')
      .populate('createdGuard', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VisitorRequest.countDocuments(query)
  ]);

  return {
    items: requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Gate / Security / Admin visitor list with filters and search
 */
const getAllVisitors = async ({ status, category, search, tower, page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (search) {
    query.$or = [
      { visitorName: { $regex: search, $options: 'i' } },
      { visitorPhone: { $regex: search, $options: 'i' } },
      { visitorCode: { $regex: search, $options: 'i' } },
      { vehicleNumber: { $regex: search, $options: 'i' } }
    ];
  }

  if (tower) {
    const flats = await Flat.find({ tower: tower.trim().toUpperCase() }).select('_id');
    query.destinationFlat = { $in: flats.map((f) => f._id) };
  }

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    VisitorRequest.find(query)
      .populate('destinationFlat', 'tower flatNumber')
      .populate('createdGuard', 'name role')
      .populate('approvedBy', 'name role')
      .populate('entryGuard', 'name')
      .populate('exitGuard', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    VisitorRequest.countDocuments(query)
  ]);

  return {
    items: requests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

module.exports = {
  createVisitorRequest,
  respondToVisitorRequest,
  markVisitorEntered,
  markVisitorExited,
  adminOverrideVisitorEntry,
  getOwnerVisitorRequests,
  getAllVisitors
};
