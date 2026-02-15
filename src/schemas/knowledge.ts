import { z } from 'zod';

export const entityCreateSchema = z.object({
  name: z.string().min(1),
  entity_type: z.string().min(1),
  description: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export const graphQueryRequestSchema = z.object({
  entity_name: z.string().min(1),
  depth: z.number().int().min(1).max(3).optional(),
  relationship_types: z.array(z.string()).optional(),
});

export const extractionRequestSchema = z.object({
  text: z.string().min(1).max(10000),
  agent_id: z.string().optional(),
  owner_user_id: z.string().optional(),
});
