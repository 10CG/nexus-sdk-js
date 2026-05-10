import { z } from 'zod';

const contextLayerSchema = z.enum(['recent', 'semantic', 'graph']);

export const contextRequestSchema = z.object({
  user_id: z.string().min(1),
  query: z.string().optional(),
  layers: z.array(contextLayerSchema).optional(),
  recent_hours: z.number().positive().optional(),
  recent_limit: z.number().int().positive().optional(),
  include_profile: z.boolean().optional(),
  profile_limit: z.number().int().positive().optional(),
  include_history: z.boolean().optional(),
  history_limit: z.number().int().positive().optional(),
  include_graph: z.boolean().optional(),
  graph_limit: z.number().int().positive().optional(),
  // RFC 3339 with required timezone offset (`offset: true`). Rejects naive
  // datetimes like `"2026-01-01T00:00:00"` to surface ingest-boundary
  // ambiguity early — see ContextRequest.as_of JSDoc.
  // Added in v1.3.0 (US-037 Wave 1 TASK-005).
  as_of: z.string().datetime({ offset: true }).optional(),
});
