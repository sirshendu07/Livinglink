const FeedMessage = require('../models/feedMessage.model');
const AppError = require('../utils/appError');
const { emitToFeed } = require('../sockets/socketEmitter');
const { ROLES } = require('../constants/roles');
const { cacheService } = require('../config/redis');
const { CACHE_KEYS, CACHE_TTL } = require('../constants/cacheKeys');

/**
 * Send a new feed message
 */
const sendMessage = async (content, user) => {
  const message = await FeedMessage.create({
    sender: user._id,
    content: content.trim()
  });

  const populated = await FeedMessage.findById(message._id)
    .populate('sender', 'name role flat')
    .lean();

  // Invalidate recent feed cache
  await cacheService.del(CACHE_KEYS.FEED_RECENT);

  // Broadcast in real-time to common feed socket room
  emitToFeed('feed:message:new', populated);

  return populated;
};

/**
 * Retrieve paginated feed messages
 */
const getFeedMessages = async ({ search, page = 1, limit = 20 }) => {
  const query = { isDeleted: false };
  if (search) {
    query.content = { $regex: search, $options: 'i' };
  }

  // Use Redis cache for the very first page without search
  const isFirstPageDefault = !search && page === 1 && limit === 20;
  if (isFirstPageDefault) {
    const cached = await cacheService.get(CACHE_KEYS.FEED_RECENT);
    if (cached) return cached;
  }

  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    FeedMessage.find(query)
      .populate('sender', 'name role flat')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    FeedMessage.countDocuments(query)
  ]);

  const result = {
    items: messages,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1
  };

  if (isFirstPageDefault) {
    await cacheService.set(CACHE_KEYS.FEED_RECENT, result, CACHE_TTL.FEED);
  }

  return result;
};

/**
 * Edit own feed message
 */
const editMessage = async (messageId, newContent, user) => {
  const message = await FeedMessage.findById(messageId);
  if (!message || message.isDeleted) {
    throw AppError.notFound('Message not found');
  }

  // Only the original author can edit
  if (message.sender.toString() !== user._id.toString()) {
    throw AppError.forbidden('You can only edit your own messages');
  }

  message.content = newContent.trim();
  message.isEdited = true;
  await message.save();

  await cacheService.del(CACHE_KEYS.FEED_RECENT);

  const populated = await FeedMessage.findById(message._id).populate('sender', 'name role flat');
  emitToFeed('feed:message:updated', populated);

  return populated;
};

/**
 * Delete message (Author or Admin moderation)
 */
const deleteMessage = async (messageId, user) => {
  const message = await FeedMessage.findById(messageId);
  if (!message || message.isDeleted) {
    throw AppError.notFound('Message not found');
  }

  const isAuthor = message.sender.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;

  if (!isAuthor && !isAdmin) {
    throw AppError.forbidden('You can only delete your own messages or moderate as admin');
  }

  message.isDeleted = true;
  message.deletedBy = user._id;
  message.deletedAt = new Date();
  await message.save();

  await cacheService.del(CACHE_KEYS.FEED_RECENT);

  emitToFeed('feed:message:deleted', { messageId, deletedByRole: user.role });
  return { success: true };
};

/**
 * Report an inappropriate feed message
 */
const reportMessage = async (messageId, reason, user) => {
  const message = await FeedMessage.findById(messageId);
  if (!message || message.isDeleted) {
    throw AppError.notFound('Message not found');
  }

  message.reports.push({
    reportedBy: user._id,
    reason: reason.trim(),
    reportedAt: new Date()
  });

  await message.save();
  return { message: 'Message reported for administrative review' };
};

module.exports = {
  sendMessage,
  getFeedMessages,
  editMessage,
  deleteMessage,
  reportMessage
};
