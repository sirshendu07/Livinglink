const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { createVisitorRequestSchema } = require('../validators/visitor.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);
router.use(authorize(ROLES.SECURITY, ROLES.ADMIN));

router.post('/entry-request', validate(createVisitorRequestSchema), visitorController.createRequest);
router.get('/visitors', visitorController.getAllVisitors);
router.patch('/visitors/:id/enter', visitorController.markEntered);
router.patch('/visitors/:id/exit', visitorController.markExited);

module.exports = router;
