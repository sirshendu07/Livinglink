const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feed.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  sendFeedMessageSchema,
  editFeedMessageSchema,
  reportFeedMessageSchema
} = require('../validators/feed.validator');
const { rateLimit } = require('../middlewares/rateLimiter.middleware');

router.use(authenticate);

// Limit message posting to 30 per minute
const feedLimiter = rateLimit('rl:feed', 30, 60);

router.get('/', feedController.getMessages);
router.post('/', feedLimiter, validate(sendFeedMessageSchema), feedController.sendMessage);
router.patch('/:id', validate(editFeedMessageSchema), feedController.editMessage);
router.delete('/:id', feedController.deleteMessage);
router.post('/:id/report', validate(reportFeedMessageSchema), feedController.reportMessage);

module.exports = router;
