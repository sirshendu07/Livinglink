const analyticsService = require('../services/analytics.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const getDashboardSummary = catchAsync(async (req, res) => {
  const summary = await analyticsService.getDashboardSummary();
  return ApiResponse.success(res, 'Admin dashboard summary retrieved', summary);
});

const getSocietyOverview = catchAsync(async (req, res) => {
  const data = await analyticsService.getSocietyOverview();
  return ApiResponse.success(res, 'Society overview analytics retrieved', data);
});

const getMaintenanceAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getMaintenanceAnalytics({
    billingMonth: req.query.billingMonth
  });
  return ApiResponse.success(res, 'Maintenance collection analytics retrieved', data);
});

const getAmenityAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getAmenityAnalytics();
  return ApiResponse.success(res, 'Amenity analytics retrieved', data);
});

const getComplaintAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getComplaintAnalytics();
  return ApiResponse.success(res, 'Complaint analytics retrieved', data);
});

const getGateAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getGateAnalytics();
  return ApiResponse.success(res, 'Gate analytics retrieved', data);
});

const getSosAnalytics = catchAsync(async (req, res) => {
  const data = await analyticsService.getSosAnalytics();
  return ApiResponse.success(res, 'SOS analytics retrieved', data);
});

module.exports = {
  getDashboardSummary,
  getSocietyOverview,
  getMaintenanceAnalytics,
  getAmenityAnalytics,
  getComplaintAnalytics,
  getGateAnalytics,
  getSosAnalytics
};
