const express = require('express');
const router = express.Router();
const sosController = require('../controllers/sos.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  triggerSosSchema,
  acknowledgeSosSchema,
  resolveSosSchema
} = require('../validators/sos.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Any authenticated role (Owner, Admin, Security) can trigger emergency SOS
router.post('/trigger', validate(triggerSosSchema), sosController.triggerSos);

// Security & Admin can view active alerts
router.get('/active', authorize(ROLES.SECURITY, ROLES.ADMIN), sosController.getActiveAlerts);

// Security can acknowledge
router.patch('/:id/acknowledge', authorize(ROLES.SECURITY, ROLES.ADMIN), validate(acknowledgeSosSchema), sosController.acknowledgeSos);

// Admin resolves alert
router.patch('/:id/resolve', authorize(ROLES.ADMIN), validate(resolveSosSchema), sosController.resolveSos);

// View alert history
router.get('/history', authorize(ROLES.ADMIN, ROLES.SECURITY), sosController.getHistory);

module.exports = router;
