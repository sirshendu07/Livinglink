const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createVisitorRequestSchema,
  approveOrRejectVisitorSchema
} = require('../validators/visitor.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Owner views visitor requests for their flat
router.get('/my', authorize(ROLES.OWNER), visitorController.getMyRequests);

// Owner approves or rejects visitor
router.patch(
  '/:id/respond',
  authorize(ROLES.OWNER),
  validate(approveOrRejectVisitorSchema),
  visitorController.respondToRequest
);

// Security guard creates visitor entry request at gate
router.post(
  '/',
  authorize(ROLES.SECURITY, ROLES.ADMIN),
  validate(createVisitorRequestSchema),
  visitorController.createRequest
);

// Security guard records entry and exit
router.patch('/:id/enter', authorize(ROLES.SECURITY, ROLES.ADMIN), visitorController.markEntered);
router.patch('/:id/exit', authorize(ROLES.SECURITY, ROLES.ADMIN), visitorController.markExited);

// Admin emergency override
router.patch('/:id/override', authorize(ROLES.ADMIN), visitorController.adminOverride);

// Gate and admin history
router.get('/', authorize(ROLES.SECURITY, ROLES.ADMIN), visitorController.getAllVisitors);

module.exports = router;
