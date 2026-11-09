const Amenity = require('../models/amenity.model');
const AmenitySubscription = require('../models/amenitySubscription.model');
const AppError = require('../utils/appError');
const { cacheService } = require('../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../constants/cacheKeys');
const { recordAuditLog } = require('../middlewares/audit.middleware');

/**
 * Invalidate amenity catalog cache
 */
const invalidateAmenityCache = async () => {
  await cacheService.del(CACHE_KEYS.AMENITIES_CATALOG);
};

/**
 * Admin creates an amenity
 */
const createAmenity = async (amenityData, adminUser) => {
  const slug = amenityData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const existing = await Amenity.findOne({ slug });
  if (existing) {
    throw AppError.conflict('An amenity with this name already exists');
  }

  const amenity = await Amenity.create({
    ...amenityData,
    slug
  });

  await invalidateAmenityCache();

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'CREATE_AMENITY',
    resourceType: 'Amenity',
    resourceId: amenity._id,
    details: { name: amenity.name }
  });

  return amenity;
};

/**
 * Admin updates an amenity or its subscription plans
 */
const updateAmenity = async (id, updateData, adminUser) => {
  const amenity = await Amenity.findById(id);
  if (!amenity) {
    throw AppError.notFound('Amenity not found');
  }

  if (updateData.name && updateData.name !== amenity.name) {
    amenity.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  Object.assign(amenity, updateData);
  await amenity.save();

  await invalidateAmenityCache();

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'UPDATE_AMENITY',
    resourceType: 'Amenity',
    resourceId: amenity._id,
    details: updateData
  });

  return amenity;
};

/**
 * Get all active amenities (Cached in Redis)
 */
const getActiveAmenities = async () => {
  const cached = await cacheService.get(CACHE_KEYS.AMENITIES_CATALOG);
  if (cached) return cached;

  const amenities = await Amenity.find({ isActive: true }).lean();
  await cacheService.set(CACHE_KEYS.AMENITIES_CATALOG, amenities, CACHE_TTL.AMENITIES);
  return amenities;
};

/**
 * Admin: Get all amenities including inactive
 */
const getAllAmenitiesAdmin = async () => {
  return Amenity.find().sort({ createdAt: -1 }).lean();
};

/**
 * Get single amenity by ID
 */
const getAmenityById = async (id) => {
  const amenity = await Amenity.findById(id);
  if (!amenity) {
    throw AppError.notFound('Amenity not found');
  }
  return amenity;
};

/**
 * Calculate subscription end date based on plan
 */
const calculateSubscriptionEndDate = (startDate, planId) => {
  const end = new Date(startDate.getTime());
  switch (planId) {
    case 'PER_DAY':
      end.setUTCDate(end.getUTCDate() + 1);
      break;
    case 'PER_WEEK':
      end.setUTCDate(end.getUTCDate() + 7);
      break;
    case 'PER_MONTH':
      end.setUTCMonth(end.getUTCMonth() + 1);
      break;
    case 'THREE_MONTHS':
      end.setUTCMonth(end.getUTCMonth() + 3);
      break;
    default:
      end.setUTCDate(end.getUTCDate() + 30);
  }
  return end;
};

module.exports = {
  createAmenity,
  updateAmenity,
  getActiveAmenities,
  getAllAmenitiesAdmin,
  getAmenityById,
  calculateSubscriptionEndDate,
  invalidateAmenityCache
};
