/**
 * Conversation Service types
 */

import type { PaginationOptions } from './common';

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Conversation object
 */
export interface Conversation {
  /** Conversation ID (UUID) */
  id: string;

  /** User ID */
  user_id: string;

  /** Session ID for grouping conversations */
  session_id?: string;

  /** Agent ID (if created by an agent) */
  agent_id?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  created_at: Date;

  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Message object
 */
export interface Message {
  /** Message ID (UUID) */
  id: string;

  /** Conversation ID */
  conversation_id: string;

  /** Message role */
  role: MessageRole;

  /** Message content */
  content: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  created_at: Date;
}

/**
 * Create conversation DTO
 */
export interface CreateConversationDto {
  /** User ID */
  user_id: string;

  /** Session ID */
  session_id?: string;

  /** Agent ID */
  agent_id?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Add message DTO
 */
export interface AddMessageDto {
  /** Message role */
  role: MessageRole;

  /** Message content */
  content: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Conversation summary
 */
export interface ConversationSummary {
  /** Conversation ID */
  conversation_id: string;

  /** Summary text */
  summary: string;

  /** Message count used for summary */
  message_count: number;

  /** Generation timestamp */
  generated_at: Date;
}
