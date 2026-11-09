const { z } = require('zod');

const sendFeedMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters').trim()
});

const editFeedMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters').trim()
});

const reportFeedMessageSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500).trim()
});

module.exports = {
  sendFeedMessageSchema,
  editFeedMessageSchema,
  reportFeedMessageSchema
};
