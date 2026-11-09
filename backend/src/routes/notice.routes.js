const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/notice.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/rbac.middleware');
const validate = require('../middlewares/validate.middleware');
const { createNoticeSchema, updateNoticeSchema } = require('../validators/notice.validator');
const { ROLES } = require('../constants/roles');

router.use(authenticate);

// All authenticated roles can view published notices and mark as read
router.get('/', noticeController.getPublishedNotices);
router.post('/:id/read', noticeController.markAsRead);

// Admin-only endpoints
router.get('/admin/all', authorize(ROLES.ADMIN), noticeController.getAllNoticesAdmin);
router.get('/:id/readers', authorize(ROLES.ADMIN), noticeController.getReadership);
router.post('/', authorize(ROLES.ADMIN), validate(createNoticeSchema), noticeController.createNotice);
router.patch('/:id', authorize(ROLES.ADMIN), validate(updateNoticeSchema), noticeController.updateNotice);
router.delete('/:id', authorize(ROLES.ADMIN), noticeController.deleteNotice);

module.exports = router;
