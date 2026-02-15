/**
 * @module services/conversations
 * @description Conversation Service - Conversation history and auto-summary management.
 *
 * Wraps the Nexus Conversation API powered by Zep OSS. Supports
 * conversation lifecycle management, message operations, and
 * auto-generated summaries via temporal graph analysis.
 *
 * Based on Nexus API v2.0 - /conversations endpoints
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type {
  Conversation,
  ConversationCreate,
  ConversationDetail,
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
  /** Filter conversations by user ID */
  user_id?: string;
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
 * Service for managing conversations and messages via Zep OSS.
 *
 * Provides conversation lifecycle management (create, list, get, delete),
 * message operations (add, list), and access to auto-generated summaries
 * produced by Zep's temporal graph analysis.
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
    return this.http.get<ConversationList>('/conversations', params as Record<string, unknown>, options?.signal);
  }

  /**
   * Retrieve a conversation with its messages included.
   *
   * @param conversationId - UUID of the conversation to retrieve.
   * @returns Conversation detail including the full message list.
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async get(conversationId: string, options?: RequestOptions): Promise<ConversationDetail> {
    return this.http.get<ConversationDetail>(`/conversations/${conversationId}`, undefined, options?.signal);
  }

  /**
   * Add a message to an existing conversation.
   *
   * The message is appended to the conversation's message sequence.
   * Zep will asynchronously update the conversation summary after
   * new messages are added.
   *
   * @param conversationId - UUID of the target conversation.
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
   * @param conversationId - UUID of the conversation.
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
   * Summaries are produced by Zep OSS temporal graph analysis and
   * include key points extracted from the conversation history.
   *
   * @param conversationId - UUID of the conversation.
   * @returns The conversation summary with key points and generation timestamp.
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async getSummary(conversationId: string, options?: RequestOptions): Promise<ConversationSummary> {
    return this.http.get<ConversationSummary>(`/conversations/${conversationId}/summary`, undefined, options?.signal);
  }

  /**
   * Delete a conversation and all its messages.
   *
   * This operation is irreversible. The conversation, all associated
   * messages, and the generated summary will be permanently removed.
   *
   * @param conversationId - UUID of the conversation to delete.
   * @throws {ApiError} 404 if the conversation does not exist.
   */
  async delete(conversationId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete<void>(`/conversations/${conversationId}`, options?.signal);
  }
}
