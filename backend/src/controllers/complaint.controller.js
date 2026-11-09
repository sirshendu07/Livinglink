const complaintService = require('../services/complaint.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const createComplaint = catchAsync(async (req, res) => {
  const complaint = await complaintService.createComplaint(req.body, req.user);
  return ApiResponse.created(res, 'Complaint submitted successfully', { complaint });
});

const getMyComplaints = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await complaintService.getMyComplaints(req.user, {
    status: req.query.status,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Your complaints retrieved', result.items, result);
});

const getAllComplaintsAdmin = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await complaintService.getAllComplaintsAdmin({
    status: req.query.status,
    category: req.query.category,
    priority: req.query.priority,
    search: req.query.search,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
    ...pagination
  });

  return ApiResponse.paginated(res, 'All society complaints retrieved', result.items, result);
});

const updateStatus = catchAsync(async (req, res) => {
  const complaint = await complaintService.updateComplaintStatus(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Complaint status updated successfully', { complaint });
});

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaintsAdmin,
  updateStatus
};
