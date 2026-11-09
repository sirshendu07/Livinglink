const { z } = require('zod');

const planSchema = z.object({
  planId: z.enum(['PER_DAY', 'PER_WEEK', 'PER_MONTH', 'THREE_MONTHS']),
  name: z.string().min(2),
  durationDays: z.number().int().positive(),
  priceInPaise: z.number().int().min(0),
  isActive: z.boolean().default(true)
});

const createAmenitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  rules: z.array(z.string()).optional(),
  openingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM').default('06:00'),
  closingTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM').default('22:00'),
  isActive: z.boolean().default(true),
  plans: z.array(planSchema).min(1, 'At least one subscription plan is required')
});

const updateAmenitySchema = createAmenitySchema.partial();

const purchaseSubscriptionSchema = z.object({
  amenityId: z.string().min(1, 'Amenity ID is required'),
  planId: z.enum(['PER_DAY', 'PER_WEEK', 'PER_MONTH', 'THREE_MONTHS']),
  paymentPassphrase: z.string().min(1, 'Demo payment passphrase is required'),
  idempotencyKey: z.string().min(8, 'Unique idempotency key is required')
});

const verifyCardSchema = z.object({
  qrToken: z.string().min(10, 'QR verification token is required')
});

const adminOverrideAccessSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amenityId: z.string().min(1, 'Amenity ID is required'),
  overrideReason: z.string().min(5, 'Mandatory reason is required for administrative override')
});

module.exports = {
  createAmenitySchema,
  updateAmenitySchema,
  purchaseSubscriptionSchema,
  verifyCardSchema,
  adminOverrideAccessSchema
};
