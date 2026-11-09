const Notice = require('../models/notice.model');
const NoticeRead = require('../models/noticeRead.model');
const AppError = require('../utils/appError');
const { cacheService } = require('../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../constants/cacheKeys');
const { emitToAll } = require('../sockets/socketEmitter');
const { NOTICE_CATEGORY } = require('../constants/statuses');
const { recordAuditLog } = require('../middlewares/audit.middleware');

/**
 * Invalidate notices cache
 */
const invalidateNoticeCache = async () => {
  await cacheService.delPattern(`${CACHE_KEYS.NOTICES_PUBLISHED}:*`);
};

/**
 * Admin creates a new notice
 */
const createNotice = async (noticeData, adminUser) => {
  const notice = await Notice.create({
    ...noticeData,
    author: adminUser._id,
    publishedAt: noticeData.isPublished ? new Date() : null
  });

  await invalidateNoticeCache();

  // If published and urgent, broadcast real-time alert to all connected sockets
  if (notice.isPublished && notice.category === NOTICE_CATEGORY.URGENT) {
    emitToAll('notice:urgent', {
      _id: notice._id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      publishedAt: notice.publishedAt
    });
  } else if (notice.isPublished) {
    emitToAll('notice:new', {
      _id: notice._id,
      title: notice.title,
      category: notice.category,
      publishedAt: notice.publishedAt
    });
  }

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'CREATE_NOTICE',
    resourceType: 'Notice',
    resourceId: notice._id,
    details: { title: notice.title, category: notice.category }
  });

  return notice;
};

/**
 * Admin updates a notice
 */
const updateNotice = async (id, updateData, adminUser) => {
  const notice = await Notice.findById(id);
  if (!notice) {
    throw AppError.notFound('Notice not found');
  }

  if (updateData.isPublished && !notice.isPublished && !notice.publishedAt) {
    updateData.publishedAt = new Date();
  }

  Object.assign(notice, updateData);
  await notice.save();

  await invalidateNoticeCache();

  if (notice.isPublished && notice.category === NOTICE_CATEGORY.URGENT) {
    emitToAll('notice:urgent', {
      _id: notice._id,
      title: notice.title,
      content: notice.content,
      category: notice.category,
      publishedAt: notice.publishedAt
    });
  }

  return notice;
};

/**
 * Admin deletes a notice
 */
const deleteNotice = async (id, adminUser) => {
  const notice = await Notice.findByIdAndDelete(id);
  if (!notice) {
    throw AppError.notFound('Notice not found');
  }

  await NoticeRead.deleteMany({ notice: id });
  await invalidateNoticeCache();

  await recordAuditLog({
    actor: adminUser._id,
    actorRole: adminUser.role,
    action: 'DELETE_NOTICE',
    resourceType: 'Notice',
    resourceId: id,
    details: { title: notice.title }
  });

  return notice;
};

/**
 * Get published notices with category filter, search, pagination, and Redis caching
 */
const getPublishedNotices = async ({ category, search, page = 1, limit = 10 }) => {
  const cacheKey = `${CACHE_KEYS.NOTICES_PUBLISHED}:${category || 'ALL'}:${search || 'NONE'}:${page}:${limit}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const query = {
    isPublished: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
  };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }

  const skip = (page - 1) * limit;
  const [notices, total] = await Promise.all([
    Notice.find(query)
      .populate('author', 'name role')
      .sort({ isPinned: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notice.countDocuments(query)
  ]);

  const result = {
    items: notices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };

  await cacheService.set(cacheKey, result, CACHE_TTL.NOTICES);
  return result;
};

/**
 * Admin: Get all notices (including drafts & expired)
 */
const getAllNoticesAdmin = async ({ category, isPublished, search, page = 1, limit = 20 }) => {
  const query = {};
  if (category) query.category = category;
  if (typeof isPublished === 'boolean') query.isPublished = isPublished;
  if (search) query.title = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const [notices, total] = await Promise.all([
    Notice.find(query)
      .populate('author', 'name role')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notice.countDocuments(query)
  ]);

  return {
    items: notices,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };
};

/**
 * Record notice readership
 */
const recordReadership = async (noticeId, userId) => {
  await NoticeRead.findOneAndUpdate(
    { notice: noticeId, user: userId },
    { readAt: new Date() },
    { upsert: true }
  );
  return { success: true };
};

/**
 * Admin: Get notice readership tracking
 */
const getNoticeReadership = async (noticeId) => {
  const reads = await NoticeRead.find({ notice: noticeId })
    .populate('user', 'name email role flat')
    .sort({ readAt: -1 })
    .lean();

  return {
    totalReads: reads.length,
    readers: reads
  };
};

module.exports = {
  createNotice,
  updateNotice,
  deleteNotice,
  getPublishedNotices,
  getAllNoticesAdmin,
  recordReadership,
  getNoticeReadership
};
