import { z } from 'zod';

const memoryTypeSchema = z.enum(['episodic', 'semantic', 'procedural']);

export const memoryCreateSchema = z.object({
  user_id: z.string().min(1),
  content: z.string().min(1).max(10000),
  memory_type: memoryTypeSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const memoryUpdateSchema = z.object({
  content: z.string().optional(),
  memory_type: memoryTypeSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const memorySearchSchema = z.object({
  user_id: z.string().min(1),
  query: z.string().min(1),
  memory_type: memoryTypeSchema.optional(),
  limit: z.number().int().min(1).max(50).optional(),
  threshold: z.number().min(0).max(1).optional(),
});
