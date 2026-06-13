/**
 * @module services/conversations
 * @description Conversation Service - Conversation history and auto-summary management.
 *
 * Wraps the Nexus Conversation API (Native implementation: incremental
 * summaries produced by the backend SummaryWorker, NOT Zep OSS). Supports
 * conversation lifecycle management, message operations, and access to
 * auto-generated summaries.
 *
 * v5.0.0: corrected stale "Zep OSS"/"temporal graph"/"API v2.0" docs — the
 * backend has always used a Native SummaryWorker.
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type {
  Conversation,
  ConversationCreate,
  ConversationList,
  Message,
  MessageCreate,
  MessageList,
  ConversationSummary,
} from '../types/conversation';
import { conversationCreateSchema, messageCreateSchema } from '../schemas/conversation';
import { InputValidationError } from '../errors/validation';

/**
 * Parameters for listing conversations with optional filtering and pagination.
 */
export interface ConversationListParams {
  /**
   * User ID within the tenant whose conversations to list.
   *
   * v5.0.0 BREAKING: now required — backend `GET /conversations` declares
   * `user_id` as `Query(..., min_length=1)`; omitting it returns 422.
   */
  user_id: string;
  /** Maximum number of results per page */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Parameters for listing messages within a conversation.
 */
export interface MessageListParams {
  /** Maximum number of messages to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Service for managing conversations and messages.
 *
 * Provides conversation lifecycle management (create, list, get, delete),
 * message operations (add, list), and access to auto-generated summaries
 * produced by the backend SummaryWorker (Native, incremental).
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_test_abc123' });
 *
 * // Create a conversation
 * const conv = await nexus.conversations.create({
 *   user_id: 'user_42',
 *   metadata: { topic: 'project planning' },
 * });
 *
 * // Add a message
 * await nexus.conversations.addMessage(conv.id, {
 *   role: 'user',
 *   content: 'Let us discuss the roadmap.',
 * });
 *
 * // Get auto-generated summary
 * const summary = await nexus.conversations.getSummary(conv.id);
 * ```
 */
export class ConversationService extends BaseService {
  /**
   * Create a new conversation session.
   *
   * @param data - Conversation creation payload including user_id and optional metadata.
   * @returns The newly created conversation with generated ID and timestamps.
   */
  async create(data: ConversationCreate, options?: RequestOptions): Promise<Conversation> {
    const parsed = conversationCreateSchema.safeParse(data);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<Conversation>('/conversations', data, options?.signal);
  }

  /**
   * List conversations with optional filtering and pagination.
   *
   * @param params - Optional filters for user_id and pagination controls.
   * @returns Paginated list of conversation records.
   */
  async list(params?: ConversationListParams, options?: RequestOptions): Promise<ConversationList> {
    return this.http.get<ConversationList>('/conversations', params as unknown as Record<string, unknown>, options?.signal);
  }

  /**
   * Retrieve a conversation.
   *
   * v4.0.0 BREAKING: returns `Conversation` — the backend response has no
   * `messages` array (the previous `ConversationDetail` shape was a
   * phantom). Fetch messages via {@link getMessages}.
   *
   * @param conversationId - Compound conversation ID to retrieve.
   * @returns The conversation record.
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async get(conversationId: string, options?: RequestOptions): Promise<Conversation> {
    return this.http.get<Conversation>(`/conversations/${conversationId}`, undefined, options?.signal);
  }

  /**
   * Add a message to an existing conversation.
   *
   * The message is appended to the conversation's message sequence. The
   * backend SummaryWorker asynchronously updates the conversation summary
   * after new messages are added.
   *
   * @param conversationId - Compound conversation ID ("tenant::user::session").
   * @param message - Message payload including role and content.
   * @returns The newly created message with generated ID and sequence number.
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async addMessage(conversationId: string, message: MessageCreate, options?: RequestOptions): Promise<Message> {
    const parsed = messageCreateSchema.safeParse(message);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<Message>(`/conversations/${conversationId}/messages`, message, options?.signal);
  }

  /**
   * List messages within a conversation with optional pagination.
   *
   * Messages are returned in chronological order (oldest first).
   *
   * @param conversationId - Compound conversation ID ("tenant::user::session").
   * @param params - Optional pagination controls (limit, offset).
   * @returns Paginated list of messages.
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async getMessages(conversationId: string, params?: MessageListParams, options?: RequestOptions): Promise<MessageList> {
    return this.http.get<MessageList>(
      `/conversations/${conversationId}/messages`,
      params as Record<string, unknown>,
      options?.signal,
    );
  }

  /**
   * Retrieve the auto-generated summary of a conversation.
   *
   * Summaries are produced incrementally by the backend SummaryWorker from
   * the conversation history.
   *
   * @param conversationId - Compound conversation ID ("tenant::user::session").
   * @returns The conversation summary ({@link ConversationSummary}: summary
   *   text + message counts + created_at). Note: no "key points" or
   *   "generated_at" fields — those were phantom (removed in v4.0.0).
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async getSummary(conversationId: string, options?: RequestOptions): Promise<ConversationSummary> {
    return this.http.get<ConversationSummary>(`/conversations/${conversationId}/summary`, undefined, options?.signal);
  }

  /**
   * Delete a conversation.
   *
   * Soft-delete: the backend sets `deleted_at` (the conversation stops
   * appearing in list/get) rather than physically removing the row and its
   * messages.
   *
   * @param conversationId - Compound conversation ID ("tenant::user::session").
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async delete(conversationId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete<void>(`/conversations/${conversationId}`, options?.signal);
  }
}
