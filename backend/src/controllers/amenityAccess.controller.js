const amenityAccessService = require('../services/amenityAccess.service');
const paymentService = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

/**
 * Owner views their amenity access card
 */
const getMyAmenityCard = catchAsync(async (req, res) => {
  const card = await amenityAccessService.getOwnerAmenityCard(req.user, req.params.amenityId);
  return ApiResponse.success(res, 'Amenity access card retrieved', { card });
});

/**
 * Guard scans / verifies QR token
 */
const verifyCard = catchAsync(async (req, res) => {
  const result = await amenityAccessService.verifyAmenityCardToken(req.body.qrToken, req.user);
  return ApiResponse.success(res, 'Access verification completed', result);
});

/**
 * Admin grants emergency / manual override for amenity access
 */
const adminOverride = catchAsync(async (req, res) => {
  const result = await amenityAccessService.adminOverrideAccess(req.body, req.user);
  return ApiResponse.success(res, result.message, result);
});

/**
 * Security / Admin views entry verification logs
 */
const getEntryLogs = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await amenityAccessService.getEntryLogs({
    amenityId: req.query.amenityId,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Amenity entry logs retrieved', result.items, result);
});

/**
 * Owner purchases subscription via demo payment
 */
const purchaseSubscription = catchAsync(async (req, res) => {
  const result = await paymentService.purchaseAmenitySubscription(req.body, req.user);
  return ApiResponse.success(res, 'Amenity subscription purchased successfully', result);
});

module.exports = {
  getMyAmenityCard,
  verifyCard,
  adminOverride,
  getEntryLogs,
  purchaseSubscription
};
