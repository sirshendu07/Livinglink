const { z } = require('zod');
const { COMPLAINT_CATEGORY, COMPLAINT_PRIORITY, COMPLAINT_STATUS } = require('../constants/statuses');

const createComplaintSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(Object.values(COMPLAINT_CATEGORY)),
  priority: z.enum(Object.values(COMPLAINT_PRIORITY)).default('MEDIUM'),
  attachments: z.array(z.string().url()).optional()
});

const updateComplaintStatusSchema = z.object({
  status: z.enum(Object.values(COMPLAINT_STATUS)),
  assignedTo: z.string().optional().nullable(),
  adminNotes: z.string().optional(),
  resolutionDetails: z.string().optional()
});

const assignComplaintSchema = z.object({
  assignedTo: z.string().min(1, 'Assignee user ID is required'),
  adminNotes: z.string().optional()
});

module.exports = {
  createComplaintSchema,
  updateComplaintStatusSchema,
  assignComplaintSchema
};
