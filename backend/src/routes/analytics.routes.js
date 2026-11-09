const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const { ROLES } = require('../constants/roles');

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.get('/dashboard', analyticsController.getDashboardSummary);
router.get('/society', analyticsController.getSocietyOverview);
router.get('/maintenance', analyticsController.getMaintenanceAnalytics);
router.get('/amenities', analyticsController.getAmenityAnalytics);
router.get('/complaints', analyticsController.getComplaintAnalytics);
router.get('/gate', analyticsController.getGateAnalytics);
router.get('/sos', analyticsController.getSosAnalytics);

module.exports = router;
