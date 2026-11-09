const express = require('express');
const router = express.Router();
const amenityAccessController = require('../controllers/amenityAccess.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  verifyCardSchema,
  adminOverrideAccessSchema
} = require('../validators/amenity.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Owner views their digital access card
router.get('/cards/:amenityId', authorize(ROLES.OWNER), amenityAccessController.getMyAmenityCard);

// Security guard checks / scans digital access card QR token
router.post('/verify', authorize(ROLES.SECURITY, ROLES.ADMIN), validate(verifyCardSchema), amenityAccessController.verifyCard);

// Admin emergency override
router.post('/override', authorize(ROLES.ADMIN), validate(adminOverrideAccessSchema), amenityAccessController.adminOverride);

// View entry logs (Security & Admin)
router.get('/logs', authorize(ROLES.SECURITY, ROLES.ADMIN), amenityAccessController.getEntryLogs);

module.exports = router;
