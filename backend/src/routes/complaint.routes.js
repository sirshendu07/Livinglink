const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createComplaintSchema,
  updateComplaintStatusSchema
} = require('../validators/complaint.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// Only OWNER can create and view own complaints
router.post(
  '/',
  authorize(ROLES.OWNER),
  validate(createComplaintSchema),
  complaintController.createComplaint
);

router.get('/my', authorize(ROLES.OWNER), complaintController.getMyComplaints);

// Admin-only management endpoints (Security has NO access)
router.get('/', authorize(ROLES.ADMIN), complaintController.getAllComplaintsAdmin);
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validate(updateComplaintStatusSchema),
  complaintController.updateStatus
);

module.exports = router;
