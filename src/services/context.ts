/**
 * Context Service
 */

import { BaseService } from './base';
import type {
  ContextRetrieveDto,
  ContextRetrieveResponse,
  ContextRetrieveOptions,
} from '../types';

/**
 * Default context retrieval options
 */
const DEFAULT_OPTIONS: ContextRetrieveOptions = {
  memory_limit: 5,
  memory_threshold: 0.7,
  history_limit: 10,
  include_graph: true,
  graph_depth: 2,
};

/**
 * Context Service API
 *
 * This is the main Chat flow API - aggregates profile, history, and knowledge
 */
export class ContextService extends BaseService {
  /**
   * Retrieve aggregated context (profile, history, graph)
   *
   * This is the primary API for chat applications - it retrieves all relevant
   * user context in a single call.
   *
   * @param data - Context retrieval parameters
   * @returns Aggregated context result
   * @example
   * ```ts
   * const context = await client.context.retrieve({
   *   user_id: 'user_123',
   *   query: 'What are the user work habits?',
   *   options: {
   *     memory_limit: 10,
   *     history_limit: 5
   *   }
   * });
   *
   * // Access aggregated data
   * console.log(context.profile?.memories);
   * console.log(context.history?.messages);
   * console.log(context.graph?.entities);
   * ```
   */
  async retrieve(data: ContextRetrieveDto): Promise<ContextRetrieveResponse> {
    const payload = {
      ...data,
      options: {
        ...DEFAULT_OPTIONS,
        ...data.options,
      },
    };

    return this.http.post<ContextRetrieveResponse>(
      '/context/retrieve',
      payload,
    );
  }

  /**
   * Retrieve user profile only
   * @param userId - User ID
   * @param query - Semantic search query
   * @param options - Retrieval options
   * @returns Context with profile only
   */
  async retrieveProfile(
    userId: string,
    query: string,
    options?: Partial<ContextRetrieveOptions>,
  ): Promise<ContextRetrieveResponse> {
    return this.retrieve({
      user_id: userId,
      query,
      options: {
        ...options,
        include_graph: false,
      },
    });
  }

  /**
   * Retrieve conversation history only
   * @param userId - User ID
   * @param sessionId - Session ID
   * @param options - Retrieval options
   * @returns Context with history only
   */
  async retrieveHistory(
    userId: string,
    sessionId: string,
    options?: Partial<ContextRetrieveOptions>,
  ): Promise<ContextRetrieveResponse> {
    return this.retrieve({
      user_id: userId,
      session_id: sessionId,
      query: '',
      options: {
        ...options,
        memory_limit: 0,
        include_graph: false,
      },
    });
  }
}
