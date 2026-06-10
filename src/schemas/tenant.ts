import { z } from 'zod';

// v3.0.0 (tenant-contract-reconciliation): aligned to backend ApiKeyCreate
// (schemas/tenant.py) — name 1-255 (was 100), scopes free-form strings
// (known values: read, write, admin, "*"; the old enum could not represent
// the backend's actual "*" default), and the real wire field name
// `expires_in_days` (the old `expires_days` was silently dropped by the
// backend, creating never-expiring keys).
export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).optional(),
  expires_in_days: z.number().int().min(1).max(365).optional(),
});
