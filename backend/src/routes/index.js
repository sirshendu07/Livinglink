const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const noticeRoutes = require('./notice.routes');
const feedRoutes = require('./feed.routes');
const amenityRoutes = require('./amenity.routes');
const subscriptionRoutes = require('./subscription.routes');
const amenityAccessRoutes = require('./amenityAccess.routes');
const maintenanceRoutes = require('./maintenance.routes');
const paymentRoutes = require('./payment.routes');
const receiptRoutes = require('./receipt.routes');
const complaintRoutes = require('./complaint.routes');
const visitorRoutes = require('./visitor.routes');
const gateRoutes = require('./gate.routes');
const sosRoutes = require('./sos.routes');
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');
const healthRoutes = require('./health.routes');

// Mount routes under /api/v1
router.use('/', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/notices', noticeRoutes);
router.use('/feed', feedRoutes);
router.use('/amenities', amenityRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/amenity-access', amenityAccessRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/payments', paymentRoutes);
router.use('/receipts', receiptRoutes);
router.use('/complaints', complaintRoutes);
router.use('/visitors', visitorRoutes);
router.use('/gate', gateRoutes);
router.use('/sos', sosRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;
