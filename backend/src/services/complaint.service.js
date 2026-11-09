const crypto = require('crypto');
const Complaint = require('../models/complaint.model');
const AppError = require('../utils/appError');
const { COMPLAINT_STATUS } = require('../constants/statuses');
const { createNotification } = require('./notification.service');
const { recordAuditLog } = require('../middlewares/audit.middleware');

/**
 * Generate unique complaint tracking number
 */
const generateComplaintNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CMP-${dateStr}-${randomSuffix}`;
};

/**
 * Owner creates a new complaint
 */
const createComplaint = async (complaintData, ownerUser) => {
  if (!ownerUser.flat) {
    throw AppError.badRequest('Owner account must be associated with a flat to file complaints');
  }

  const complaintNumber = generateComplaintNumber();

  const complaint = await Complaint.create({
    complaintNumber,
    user: ownerUser._id,
    flat: ownerUser.flat._id || ownerUser.flat,
    title: complaintData.title.trim(),
    description: complaintData.description.trim(),
    category: complaintData.category,
    priority: complaintData.priority || 'MEDIUM',
    status: COMPLAINT_STATUS.SUBMITTED,
    attachments: complaintData.attachments || []
  });

  const populated = await Complaint.findById(complaint._id)
    .populate('user', 'name email phone')
    .populate('flat', 'tower flatNumber')
    .lean();

  return populated;
};

/**
 * Owner views their own complaints
 */
const getMyComplaints = async (ownerUser, { status, page = 1, limit = 20 }) => {
  const query = { user: ownerUser._id };
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('flat', 'tower flatNumber')
      .populate('assignedTo', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(query)
  ]);

  return {
    items: complaints,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Admin: Get all society complaints with filtering, search and sorting
 */
const getAllComplaintsAdmin = async ({ status, category, priority, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20 }) => {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (priority) query.priority = priority;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { complaintNumber: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
  const skip = (page - 1) * limit;

  const [complaints, total] = await Promise.all([
    Complaint.find(query)
      .populate('user', 'name email phone')
      .populate('flat', 'tower flatNumber')
      .populate('assignedTo', 'name role')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Complaint.countDocuments(query)
  ]);

  return {
    items: complaints,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Admin updates complaint status, assigns, or resolves
 */
const updateComplaintStatus = async (id, { status, assignedTo, adminNotes, resolutionDetails }, adminUser) => {
  const complaint = await Complaint.findById(id).populate('user');
  if (!complaint) {
    throw AppError.notFound('Complaint not found');
  }

  if (status) complaint.status = status;
  if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
  if (adminNotes) complaint.adminNotes = adminNotes;
  if (resolutionDetails) complaint.resolutionDetails = resolutionDetails;

  await complaint.save();

  // Notify owner of complaint status update
  if (complaint.user) {
    await createNotification({
      recipient: complaint.user._id,
      type: 'COMPLAINT_STATUS_UPDATED',
      title: 'Complaint Status Update',
      message: `Your complaint (${complaint.complaintNumber} - "${complaint.title}") status changed to: ${complaint.status}`,
      data: { complaintId: complaint._id, status: complaint.status }
    });
  }

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'UPDATE_COMPLAINT_STATUS',
    resourceType: 'Complaint',
    resourceId: complaint._id,
    details: { status: complaint.status, complaintNumber: complaint.complaintNumber }
  });

  return complaint;
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaintsAdmin,
  updateComplaintStatus
};
