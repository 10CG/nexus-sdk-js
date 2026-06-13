import { z } from 'zod';

const messageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool']);

// v5.0.0 BREAKING: removed phantom `session_id` (backend silently drops it;
// session id is always auto-generated server-side) + added `agent_id`
// (backend accepts it, the SDK previously had no way to send it). Mirrors
// backend `CreateConversationRequest` = {user_id, agent_id?, metadata}.
export const conversationCreateSchema = z.object({
  user_id: z.string().min(1),
  agent_id: z.string().max(255).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const messageCreateSchema = z.object({
  role: messageRoleSchema,
  content: z.string().min(1).max(50000),
  metadata: z.record(z.unknown()).optional(),
});
