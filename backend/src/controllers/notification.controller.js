const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const getMyNotifications = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const unreadOnly = req.query.unreadOnly === 'true';

  const result = await notificationService.getUserNotifications(req.user._id, {
    unreadOnly,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Notifications retrieved', result.items, result);
});

const markAsRead = catchAsync(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user._id);
  return ApiResponse.success(res, 'Notification marked as read', { notification });
});

const markAllAsRead = catchAsync(async (req, res) => {
  const count = await notificationService.markAllAsRead(req.user._id);
  return ApiResponse.success(res, `${count} notifications marked as read`);
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
