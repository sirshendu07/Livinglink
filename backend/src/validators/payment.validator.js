const { z } = require('zod');

const payMaintenanceSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  paymentPassphrase: z.string().min(1, 'Demo payment passphrase is required'),
  idempotencyKey: z.string().min(8, 'Unique idempotency key is required')
});

module.exports = {
  payMaintenanceSchema
};
