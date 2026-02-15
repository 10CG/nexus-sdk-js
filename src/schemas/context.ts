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
});
