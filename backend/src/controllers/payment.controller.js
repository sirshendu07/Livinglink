const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');
const { ROLES } = require('../constants/roles');

const payMaintenance = catchAsync(async (req, res) => {
  const result = await paymentService.payMaintenanceInvoice(req.body, req.user);
  return ApiResponse.success(res, 'Maintenance bill paid successfully via demo simulation', result);
});

const getPayments = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const isAdmin = req.user.role === ROLES.ADMIN;

  const result = await paymentService.getPayments({
    userId: isAdmin ? req.query.userId : req.user._id,
    paymentType: req.query.paymentType,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Payment records retrieved', result.items, result);
});

module.exports = {
  payMaintenance,
  getPayments
};
