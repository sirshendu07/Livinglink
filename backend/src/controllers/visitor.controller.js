const visitorService = require('../services/visitor.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const createRequest = catchAsync(async (req, res) => {
  const request = await visitorService.createVisitorRequest(req.body, req.user);
  return ApiResponse.created(res, 'Visitor entry request submitted to resident', { request });
});

const respondToRequest = catchAsync(async (req, res) => {
  const request = await visitorService.respondToVisitorRequest(req.params.id, req.body, req.user);
  return ApiResponse.success(res, `Visitor entry request has been ${request.status}`, { request });
});

const markEntered = catchAsync(async (req, res) => {
  const request = await visitorService.markVisitorEntered(req.params.id, req.user);
  return ApiResponse.success(res, 'Visitor entry recorded', { request });
});

const markExited = catchAsync(async (req, res) => {
  const request = await visitorService.markVisitorExited(req.params.id, req.user);
  return ApiResponse.success(res, 'Visitor exit recorded', { request });
});

const adminOverride = catchAsync(async (req, res) => {
  const request = await visitorService.adminOverrideVisitorEntry(req.params.id, req.body.reason, req.user);
  return ApiResponse.success(res, 'Admin emergency override granted for visitor', { request });
});

const getMyRequests = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await visitorService.getOwnerVisitorRequests(req.user.flat?._id || req.user.flat, {
    status: req.query.status,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Visitor requests retrieved for flat', result.items, result);
});

const getAllVisitors = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await visitorService.getAllVisitors({
    status: req.query.status,
    category: req.query.category,
    search: req.query.search,
    tower: req.query.tower,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Visitor logs retrieved', result.items, result);
});

module.exports = {
  createRequest,
  respondToRequest,
  markEntered,
  markExited,
  adminOverride,
  getMyRequests,
  getAllVisitors
};
