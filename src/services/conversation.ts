/**
 * Conversation Service
 */

import { BaseService } from './base';
import type {
  Conversation,
  Message,
  CreateConversationDto,
  AddMessageDto,
  ConversationSummary,
} from '../types';

/**
 * Conversation Service API
 */
export class ConversationService extends BaseService {
  /**
   * Create a new conversation
   * @param data - Conversation data
   * @returns Created conversation object
   * @example
   * ```ts
   * const conversation = await client.conversations.create({
   *   user_id: 'user_123',
   *   session_id: 'session_abc'
   * });
   * ```
   */
  async create(data: CreateConversationDto): Promise<Conversation> {
    return this.http.post<Conversation>('/conversations', data);
  }

  /**
   * Get a conversation by ID
   * @param id - Conversation ID
   * @returns Conversation object
   */
  async get(id: string): Promise<Conversation> {
    return this.http.get<Conversation>(`/conversations/${id}`);
  }

  /**
   * Add a message to a conversation
   * @param conversationId - Conversation ID
   * @param data - Message data
   * @returns Created message object
   * @example
   * ```ts
   * const message = await client.conversations.addMessage(conversationId, {
   *   role: 'user',
   *   content: 'Hello!'
   * });
   * ```
   */
  async addMessage(
    conversationId: string,
    data: AddMessageDto,
  ): Promise<Message> {
    return this.http.post<Message>(
      `/conversations/${conversationId}/messages`,
      data,
    );
  }

  /**
   * Get messages from a conversation
   * @param conversationId - Conversation ID
   * @param params - Query parameters
   * @returns Array of messages
   */
  async getMessages(
    conversationId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Message[]> {
    return this.http.get<Message[]>(
      `/conversations/${conversationId}/messages`,
      params,
    );
  }

  /**
   * Get conversation summary
   * @param conversationId - Conversation ID
   * @returns Summary text
   */
  async getSummary(conversationId: string): Promise<string> {
    const response = await this.http.get<{ summary: string }>(
      `/conversations/${conversationId}/summary`,
    );
    return response.summary;
  }

  /**
   * List conversations for a user
   * @param userId - User ID
   * @param params - Query parameters
   * @returns Array of conversations
   */
  async list(
    userId: string,
    params?: { limit?: number; offset?: number; session_id?: string },
  ): Promise<Conversation[]> {
    return this.http.get<Conversation[]>('/conversations', {
      user_id: userId,
      ...params,
    });
  }

  /**
   * Delete a conversation
   * @param id - Conversation ID
   */
  async delete(id: string): Promise<void> {
    return this.http.delete(`/conversations/${id}`);
  }
}
