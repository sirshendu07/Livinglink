const { z } = require('zod');

const triggerSosSchema = z.object({
  notes: z.string().max(500).optional().default('Emergency assistance requested')
});

const acknowledgeSosSchema = z.object({
  notes: z.string().max(500).optional()
});

const resolveSosSchema = z.object({
  resolutionNotes: z.string().min(3, 'Resolution notes are mandatory and must be at least 3 characters')
});

module.exports = {
  triggerSosSchema,
  acknowledgeSosSchema,
  resolveSosSchema
};
