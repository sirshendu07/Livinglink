const Notification = require('../models/notification.model');
const { emitToUser } = require('../sockets/socketEmitter');
const logger = require('../config/logger');

/**
 * Create a persistent notification and deliver via Socket.IO
 */
const createNotification = async ({ recipient, type, title, message, data = {} }) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      data
    });

    // Real-time dispatch to user's private socket room
    emitToUser(recipient, 'notification:new', {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.createdAt
    });

    return notification;
  } catch (err) {
    logger.warn({ err: err.message, recipient, type }, 'Failed to create notification');
    return null;
  }
};

/**
 * Get paginated user notifications
 */
const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
  const query = { recipient: userId };
  if (unreadOnly) {
    query.isRead = false;
  }

  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, isRead: false })
  ]);

  return {
    items: notifications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    unreadCount
  };
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return result.modifiedCount;
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
