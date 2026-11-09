const maintenanceService = require('../services/maintenance.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const createInvoice = catchAsync(async (req, res) => {
  const invoice = await maintenanceService.createInvoice(req.body, req.user);
  return ApiResponse.created(res, 'Maintenance invoice generated successfully', { invoice });
});

const generateBulkInvoices = catchAsync(async (req, res) => {
  const result = await maintenanceService.generateBulkInvoices(req.body, req.user);
  return ApiResponse.created(res, `Bulk generated ${result.generatedCount} invoices for month ${result.billingMonth}`, result);
});

const recordWaiver = catchAsync(async (req, res) => {
  const invoice = await maintenanceService.recordWaiver(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Invoice adjustment/waiver recorded successfully', { invoice });
});

const getMyInvoices = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await maintenanceService.getOwnerInvoices(req.user.flat?._id || req.user.flat, {
    status: req.query.status,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Owner maintenance invoices retrieved', result.items, result);
});

const getAllInvoicesAdmin = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await maintenanceService.getAllInvoicesAdmin({
    tower: req.query.tower,
    flatNumber: req.query.flatNumber,
    status: req.query.status,
    billingMonth: req.query.billingMonth,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Society maintenance invoices retrieved', result.items, result);
});

const getDefaulters = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await maintenanceService.getDefaulters({
    tower: req.query.tower,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Maintenance defaulters retrieved', result.items, result);
});

module.exports = {
  createInvoice,
  generateBulkInvoices,
  recordWaiver,
  getMyInvoices,
  getAllInvoicesAdmin,
  getDefaulters
};
