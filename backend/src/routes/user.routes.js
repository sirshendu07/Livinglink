const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { createStaffSchema } = require('../validators/auth.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Admin-only management endpoints
router.post('/staff', authorize(ROLES.ADMIN), validate(createStaffSchema), userController.createStaff);
router.patch('/:id/approve', authorize(ROLES.ADMIN), userController.approveOwner);
router.patch('/:id/status', authorize(ROLES.ADMIN), userController.updateStatus);
router.get('/audit-logs', authorize(ROLES.ADMIN), userController.getAuditLogs);
router.get('/flats', authorize(ROLES.ADMIN, ROLES.SECURITY), userController.getFlats);
router.get('/', authorize(ROLES.ADMIN), userController.getUsers);

module.exports = router;
