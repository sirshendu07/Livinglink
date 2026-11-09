const noticeService = require('../services/notice.service');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPagination } = require('../utils/pagination');

const createNotice = catchAsync(async (req, res) => {
  const notice = await noticeService.createNotice(req.body, req.user);
  return ApiResponse.created(res, 'Notice created successfully', { notice });
});

const updateNotice = catchAsync(async (req, res) => {
  const notice = await noticeService.updateNotice(req.params.id, req.body, req.user);
  return ApiResponse.success(res, 'Notice updated successfully', { notice });
});

const deleteNotice = catchAsync(async (req, res) => {
  await noticeService.deleteNotice(req.params.id, req.user);
  return ApiResponse.success(res, 'Notice deleted successfully');
});

const getPublishedNotices = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const result = await noticeService.getPublishedNotices({
    category: req.query.category,
    search: req.query.search,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Published notices retrieved', result.items, result);
});

const getAllNoticesAdmin = catchAsync(async (req, res) => {
  const pagination = getPagination(req.query);
  const isPublished = req.query.isPublished !== undefined ? req.query.isPublished === 'true' : undefined;
  const result = await noticeService.getAllNoticesAdmin({
    category: req.query.category,
    isPublished,
    search: req.query.search,
    ...pagination
  });

  return ApiResponse.paginated(res, 'Admin notices list retrieved', result.items, result);
});

const markAsRead = catchAsync(async (req, res) => {
  await noticeService.recordReadership(req.params.id, req.user._id);
  return ApiResponse.success(res, 'Notice marked as read');
});

const getReadership = catchAsync(async (req, res) => {
  const stats = await noticeService.getNoticeReadership(req.params.id);
  return ApiResponse.success(res, 'Readership data retrieved', stats);
});

module.exports = {
  createNotice,
  updateNotice,
  deleteNotice,
  getPublishedNotices,
  getAllNoticesAdmin,
  markAsRead,
  getReadership
};
