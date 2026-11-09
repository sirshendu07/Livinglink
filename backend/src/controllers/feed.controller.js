const feedService = require('../services/feed.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const sendMessage = catchAsync(async (req, res) => {
  const message = await feedService.sendMessage(req.body.content, req.user);
  return ApiResponse.created(res, 'Message sent successfully', { message });
});

const getMessages = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await feedService.getFeedMessages({
    search: req.query.search,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Feed messages retrieved', result.items, result);
});

const editMessage = catchAsync(async (req, res) => {
  const message = await feedService.editMessage(req.params.id, req.body.content, req.user);
  return ApiResponse.success(res, 'Message edited successfully', { message });
});

const deleteMessage = catchAsync(async (req, res) => {
  await feedService.deleteMessage(req.params.id, req.user);
  return ApiResponse.success(res, 'Message deleted successfully');
});

const reportMessage = catchAsync(async (req, res) => {
  const result = await feedService.reportMessage(req.params.id, req.body.reason, req.user);
  return ApiResponse.success(res, result.message);
});

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  reportMessage
};
