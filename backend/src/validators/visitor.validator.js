const { z } = require('zod');
const { VISITOR_CATEGORY } = require('../constants/statuses');

const createVisitorRequestSchema = z.object({
  visitorName: z.string().min(2, 'Visitor name must be at least 2 characters').trim(),
  visitorPhone: z.string().min(10, 'Visitor phone must be at least 10 digits').trim(),
  tower: z.string().min(1, 'Destination tower is required').trim(),
  flatNumber: z.string().min(1, 'Destination flat number is required').trim(),
  category: z.enum(Object.values(VISITOR_CATEGORY)),
  purpose: z.string().optional(),
  vehicleNumber: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable()
});

const approveOrRejectVisitorSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional()
});

module.exports = {
  createVisitorRequestSchema,
  approveOrRejectVisitorSchema
};
