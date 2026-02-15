import { z } from 'zod';

const messageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool']);

export const conversationCreateSchema = z.object({
  user_id: z.string().min(1),
  session_id: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const messageCreateSchema = z.object({
  role: messageRoleSchema,
  content: z.string().min(1).max(50000),
  metadata: z.record(z.unknown()).optional(),
});
