const User = require('../models/user.model');
const Flat = require('../models/flat.model');
const MaintenanceInvoice = require('../models/maintenanceInvoice.model');
const AmenitySubscription = require('../models/amenitySubscription.model');
const Complaint = require('../models/complaint.model');
const VisitorRequest = require('../models/visitorRequest.model');
const SosAlert = require('../models/sosAlert.model');
const { ROLES } = require('../constants/roles');
const {
  USER_STATUS,
  MAINTENANCE_STATUS,
  SUBSCRIPTION_STATUS,
  VISITOR_STATUS,
  SOS_STATUS
} = require('../constants/statuses');
const { cacheService } = require('../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../constants/cacheKeys');

/**
 * Society Overview Statistics
 */
const getSocietyOverview = async () => {
  const [totalOwners, totalFlats, totalAdmins, totalSecurity, pendingApprovals] = await Promise.all([
    User.countDocuments({ role: ROLES.OWNER }),
    Flat.countDocuments(),
    User.countDocuments({ role: ROLES.ADMIN }),
    User.countDocuments({ role: ROLES.SECURITY }),
    User.countDocuments({ role: ROLES.OWNER, status: USER_STATUS.PENDING_APPROVAL })
  ]);

  return {
    totalOwners,
    totalFlats,
    totalAdmins,
    totalSecurity,
    pendingApprovals
  };
};

/**
 * Maintenance Analytics using Aggregation Pipeline
 */
const getMaintenanceAnalytics = async ({ billingMonth } = {}) => {
  const matchStage = {};
  if (billingMonth) matchStage.billingMonth = billingMonth;

  const summaryAgg = await MaintenanceInvoice.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBilledInPaise: { $sum: '$amountInPaise' },
        totalCollectedInPaise: {
          $sum: {
            $cond: [{ $eq: ['$status', MAINTENANCE_STATUS.PAID] }, '$amountInPaise', 0]
          }
        },
        totalWaiversInPaise: { $sum: '$waiverAmountInPaise' },
        totalPaidCount: {
          $sum: { $cond: [{ $eq: ['$status', MAINTENANCE_STATUS.PAID] }, 1, 0] }
        },
        totalUnpaidCount: {
          $sum: { $cond: [{ $ne: ['$status', MAINTENANCE_STATUS.PAID] }, 1, 0] }
        }
      }
    }
  ]);

  const summary = summaryAgg[0] || {
    totalBilledInPaise: 0,
    totalCollectedInPaise: 0,
    totalWaiversInPaise: 0,
    totalPaidCount: 0,
    totalUnpaidCount: 0
  };

  const totalOutstandingInPaise = Math.max(0, summary.totalBilledInPaise - summary.totalCollectedInPaise - summary.totalWaiversInPaise);

  // Collection breakdown by billing month
  const monthlyCollection = await MaintenanceInvoice.aggregate([
    {
      $group: {
        _id: '$billingMonth',
        billed: { $sum: '$amountInPaise' },
        collected: {
          $sum: {
            $cond: [{ $eq: ['$status', MAINTENANCE_STATUS.PAID] }, '$amountInPaise', 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 12 }
  ]);

  // Defaulters count (unpaid invoices past due date)
  const totalDefaulters = await MaintenanceInvoice.distinct('flat', {
    status: { $in: [MAINTENANCE_STATUS.UNPAID, MAINTENANCE_STATUS.OVERDUE] },
    dueDate: { $lt: new Date() }
  });

  return {
    totalBilledInPaise: summary.totalBilledInPaise,
    totalCollectedInPaise: summary.totalCollectedInPaise,
    totalOutstandingInPaise,
    totalWaiversInPaise: summary.totalWaiversInPaise,
    paidInvoicesCount: summary.totalPaidCount,
    unpaidInvoicesCount: summary.totalUnpaidCount,
    totalDefaultersCount: totalDefaulters.length,
    monthlyCollection
  };
};

/**
 * Amenity & Subscription Analytics using Aggregation
 */
const getAmenityAnalytics = async () => {
  const now = new Date();

  const [activeCount, expiredCount] = await Promise.all([
    AmenitySubscription.countDocuments({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }),
    AmenitySubscription.countDocuments({
      $or: [{ status: SUBSCRIPTION_STATUS.EXPIRED }, { endDate: { $lt: now } }]
    })
  ]);

  // Revenue by Amenity
  const revenueByAmenity = await AmenitySubscription.aggregate([
    {
      $group: {
        _id: '$amenity',
        totalRevenueInPaise: { $sum: '$priceInPaise' },
        subscriptionsCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'amenities',
        localField: '_id',
        foreignField: '_id',
        as: 'amenityDoc'
      }
    },
    { $unwind: '$amenityDoc' },
    {
      $project: {
        amenityId: '$_id',
        name: '$amenityDoc.name',
        totalRevenueInPaise: 1,
        subscriptionsCount: 1
      }
    }
  ]);

  // Revenue by Plan
  const revenueByPlan = await AmenitySubscription.aggregate([
    {
      $group: {
        _id: '$planId',
        totalRevenueInPaise: { $sum: '$priceInPaise' },
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    activeSubscriptions: activeCount,
    expiredSubscriptions: expiredCount,
    revenueByAmenity,
    revenueByPlan
  };
};

/**
 * Complaint Analytics
 */
const getComplaintAnalytics = async () => {
  const statsByStatus = await Complaint.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statsByCategory = await Complaint.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  const statsByPriority = await Complaint.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await Complaint.countDocuments();

  return {
    totalComplaints: total,
    byStatus: statsByStatus,
    byCategory: statsByCategory,
    byPriority: statsByPriority
  };
};

/**
 * Gate & Visitor Analytics
 */
const getGateAnalytics = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalToday, pendingCount, approvedCount, rejectedCount, currentlyInsideCount] = await Promise.all([
    VisitorRequest.countDocuments({ createdAt: { $gte: startOfDay } }),
    VisitorRequest.countDocuments({ status: VISITOR_STATUS.PENDING, createdAt: { $gte: startOfDay } }),
    VisitorRequest.countDocuments({ status: VISITOR_STATUS.APPROVED, createdAt: { $gte: startOfDay } }),
    VisitorRequest.countDocuments({ status: VISITOR_STATUS.REJECTED, createdAt: { $gte: startOfDay } }),
    VisitorRequest.countDocuments({ status: VISITOR_STATUS.ENTERED })
  ]);

  const categoryBreakdown = await VisitorRequest.aggregate([
    { $match: { createdAt: { $gte: startOfDay } } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  return {
    today: {
      totalVisitors: totalToday,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    },
    currentlyInside: currentlyInsideCount,
    categoryBreakdown
  };
};

/**
 * SOS Emergency Analytics
 */
const getSosAnalytics = async () => {
  const [activeCount, ackCount, resolvedCount] = await Promise.all([
    SosAlert.countDocuments({ status: SOS_STATUS.ACTIVE }),
    SosAlert.countDocuments({ status: SOS_STATUS.ACKNOWLEDGED }),
    SosAlert.countDocuments({ status: SOS_STATUS.RESOLVED })
  ]);

  // Calculate average response time (difference between createdAt and acknowledgedAt)
  const responseTimeAgg = await SosAlert.aggregate([
    {
      $match: {
        acknowledgedAt: { $ne: null }
      }
    },
    {
      $project: {
        durationSeconds: {
          $divide: [{ $subtract: ['$acknowledgedAt', '$createdAt'] }, 1000]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTimeSeconds: { $avg: '$durationSeconds' }
      }
    }
  ]);

  const avgResponseTimeSeconds = responseTimeAgg[0]?.avgResponseTimeSeconds
    ? Math.round(responseTimeAgg[0].avgResponseTimeSeconds)
    : 0;

  return {
    activeAlerts: activeCount,
    acknowledgedAlerts: ackCount,
    resolvedAlerts: resolvedCount,
    averageResponseTimeSeconds: avgResponseTimeSeconds
  };
};

/**
 * Consolidated Admin Dashboard Summary (Cached in Redis)
 */
const getDashboardSummary = async () => {
  const cached = await cacheService.get(CACHE_KEYS.DASHBOARD_STATS);
  if (cached) return cached;

  const [society, maintenance, amenities, complaints, gate, sos] = await Promise.all([
    getSocietyOverview(),
    getMaintenanceAnalytics(),
    getAmenityAnalytics(),
    getComplaintAnalytics(),
    getGateAnalytics(),
    getSosAnalytics()
  ]);

  const dashboard = {
    society,
    maintenance,
    amenities,
    complaints,
    gate,
    sos
  };

  await cacheService.set(CACHE_KEYS.DASHBOARD_STATS, dashboard, CACHE_TTL.DASHBOARD);
  return dashboard;
};

module.exports = {
  getSocietyOverview,
  getMaintenanceAnalytics,
  getAmenityAnalytics,
  getComplaintAnalytics,
  getGateAnalytics,
  getSosAnalytics,
  getDashboardSummary
};
