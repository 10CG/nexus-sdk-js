import { z } from 'zod';

// v3.0.0: entityCreateSchema removed with KnowledgeService.createEntity()
// (phantom POST /knowledge/entities — no backend route; Q8-A).

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
