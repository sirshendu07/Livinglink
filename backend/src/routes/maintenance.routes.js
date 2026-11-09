const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createInvoiceSchema,
  generateBulkInvoicesSchema,
  recordWaiverSchema
} = require('../validators/maintenance.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Owner views their own flat maintenance bills
router.get('/my', authorize(ROLES.OWNER), maintenanceController.getMyInvoices);

// Admin-only maintenance management endpoints
router.get('/admin/all', authorize(ROLES.ADMIN), maintenanceController.getAllInvoicesAdmin);
router.get('/admin/defaulters', authorize(ROLES.ADMIN), maintenanceController.getDefaulters);
router.post('/', authorize(ROLES.ADMIN), validate(createInvoiceSchema), maintenanceController.createInvoice);
router.post('/bulk', authorize(ROLES.ADMIN), validate(generateBulkInvoicesSchema), maintenanceController.generateBulkInvoices);
router.patch('/:id/waiver', authorize(ROLES.ADMIN), validate(recordWaiverSchema), maintenanceController.recordWaiver);

module.exports = router;
