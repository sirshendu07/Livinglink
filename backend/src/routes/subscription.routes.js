const express = require('express');
const router = express.Router();
const amenityAccessController = require('../controllers/amenityAccess.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { purchaseSubscriptionSchema } = require('../validators/amenity.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Owner purchases amenity subscription using demo payment
router.post(
  '/purchase',
  authorize(ROLES.OWNER),
  validate(purchaseSubscriptionSchema),
  amenityAccessController.purchaseSubscription
);

module.exports = router;
