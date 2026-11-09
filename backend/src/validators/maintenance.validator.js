const { z } = require('zod');

const createInvoiceSchema = z.object({
  flatId: z.string().min(1, 'Flat ID is required'),
  billingMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Billing month must be YYYY-MM format'),
  amountInPaise: z.number().int().positive('Amount must be greater than zero'),
  dueDate: z.string().datetime('Due date must be a valid ISO date string')
});

const generateBulkInvoicesSchema = z.object({
  billingMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Billing month must be YYYY-MM format'),
  amountInPaise: z.number().int().positive('Amount must be greater than zero'),
  dueDate: z.string().datetime('Due date must be a valid ISO date string'),
  tower: z.string().optional() // Optional tower filter
});

const recordWaiverSchema = z.object({
  waiverAmountInPaise: z.number().int().positive('Waiver amount must be positive'),
  reason: z.string().min(5, 'Reason for waiver is mandatory and must be at least 5 characters')
});

module.exports = {
  createInvoiceSchema,
  generateBulkInvoicesSchema,
  recordWaiverSchema
};
