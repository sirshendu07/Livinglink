const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/amenity.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { createAmenitySchema, updateAmenitySchema } = require('../validators/amenity.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Public / Authenticated catalog browsing
router.get('/', amenityController.getActiveAmenities);
router.get('/:id', amenityController.getAmenityById);

// Admin-only management endpoints
router.get('/admin/all', authorize(ROLES.ADMIN), amenityController.getAllAmenitiesAdmin);
router.post('/', authorize(ROLES.ADMIN), validate(createAmenitySchema), amenityController.createAmenity);
router.patch('/:id', authorize(ROLES.ADMIN), validate(updateAmenitySchema), amenityController.updateAmenity);

module.exports = router;
