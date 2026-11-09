const userService = require('../services/user.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const createStaff = catchAsync(async (req, res) => {
  const staff = await userService.createStaffAccount(req.body, req.user);
  return ApiResponse.created(res, 'Staff account created successfully', { staff });
});

const approveOwner = catchAsync(async (req, res) => {
  const user = await userService.approveOwnerAccount(req.params.id, req.user);
  return ApiResponse.success(res, 'Owner account approved successfully', { user });
});

const updateStatus = catchAsync(async (req, res) => {
  const { status, reason } = req.body;
  const user = await userService.updateUserStatus(req.params.id, status, req.user, reason);
  return ApiResponse.success(res, `User status updated to ${status}`, { user });
});

const getUsers = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await userService.getAllUsers({
    role: req.query.role,
    status: req.query.status,
    search: req.query.search,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Users retrieved successfully', result.items, result);
});

const getFlats = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await userService.getAllFlats({
    tower: req.query.tower,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Flats retrieved successfully', result.items, result);
});

const getAuditLogs = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await userService.getAuditLogs({
    action: req.query.action,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Audit logs retrieved successfully', result.items, result);
});

module.exports = {
  createStaff,
  approveOwner,
  updateStatus,
  getUsers,
  getFlats,
  getAuditLogs
};
