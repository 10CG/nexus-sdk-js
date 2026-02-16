import { z } from 'zod';

const apiKeyScopeSchema = z.enum(['read', 'write', 'admin']);

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(apiKeyScopeSchema).optional(),
  expires_days: z.number().int().min(1).max(365).optional(),
});
