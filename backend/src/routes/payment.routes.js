const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { payMaintenanceSchema } = require('../validators/payment.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Owner pays maintenance via demo payment
router.post(
  '/pay-maintenance',
  authorize(ROLES.OWNER),
  validate(payMaintenanceSchema),
  paymentController.payMaintenance
);

// Payment history (Owner views their own, Admin can view all)
router.get('/', authorize(ROLES.OWNER, ROLES.ADMIN), paymentController.getPayments);

module.exports = router;
