const sosService = require('../services/sos.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const triggerSos = catchAsync(async (req, res) => {
  const alert = await sosService.triggerSos(req.body.notes, req.user);
  return ApiResponse.created(res, 'EMERGENCY SOS ALERT ACTIVATED! Security and administration have been notified.', { alert });
});

const acknowledgeSos = catchAsync(async (req, res) => {
  const alert = await sosService.acknowledgeSos(req.params.id, req.body.notes, req.user);
  return ApiResponse.success(res, 'SOS emergency alert acknowledged', { alert });
});

const resolveSos = catchAsync(async (req, res) => {
  const alert = await sosService.resolveSos(req.params.id, req.body.resolutionNotes, req.user);
  return ApiResponse.success(res, 'SOS emergency alert marked as resolved', { alert });
});

const getActiveAlerts = catchAsync(async (req, res) => {
  const alerts = await sosService.getActiveAlerts();
  return ApiResponse.success(res, 'Active emergency alerts retrieved', { alerts });
});

const getHistory = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await sosService.getSosHistory({
    status: req.query.status,
    ...pagination
  });

  return ApiResponse.paginated(res, 'SOS alerts history retrieved', result.items, result);
});

module.exports = {
  triggerSos,
  acknowledgeSos,
  resolveSos,
  getActiveAlerts,
  getHistory
};
