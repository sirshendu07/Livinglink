const amenityService = require('../services/amenity.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

const createAmenity = catchAsync(async (req, res) => {
  const amenity = await amenityService.createAmenity(req.body, req.user);
  return ApiResponse.created(res, 'Amenity created successfully', { amenity });
});

const updateAmenity = catchAsync(async (req, res) => {
  const amenity = await amenityService.updateAmenity(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Amenity updated successfully', { amenity });
});

const getActiveAmenities = catchAsync(async (req, res) => {
  const amenities = await amenityService.getActiveAmenities();
  return ApiResponse.success(res, 'Amenities catalog retrieved', { amenities });
});

const getAllAmenitiesAdmin = catchAsync(async (req, res) => {
  const amenities = await amenityService.getAllAmenitiesAdmin();
  return ApiResponse.success(res, 'Admin amenities list retrieved', { amenities });
});

const getAmenityById = catchAsync(async (req, res) => {
  const amenity = await amenityService.getAmenityById(req.params.id);
  return ApiResponse.success(res, 'Amenity details retrieved', { amenity });
});

module.exports = {
  createAmenity,
  updateAmenity,
  getActiveAmenities,
  getAllAmenitiesAdmin,
  getAmenityById
};
