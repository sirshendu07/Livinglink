const { z } = require('zod');
const { NOTICE_CATEGORY_LIST } = require('../constants/statuses');

const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().min(5, 'Content must be at least 5 characters'),
  category: z.enum(NOTICE_CATEGORY_LIST).default('GENERAL'),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string().optional()
      })
    )
    .optional()
});

const updateNoticeSchema = createNoticeSchema.partial();

module.exports = {
  createNoticeSchema,
  updateNoticeSchema
};
