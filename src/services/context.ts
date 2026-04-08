/**
 * @module services/context
 * @description Context Service - Aggregated context retrieval for Chat main flows.
 *
 * The Context Service is the primary entry point for AI agents to fetch
 * all relevant user context in a single call. It orchestrates parallel
 * retrieval across Memory (Mem0), Conversation (Zep), and Knowledge
 * (GraphRAG) layers.
 *
 * Based on Nexus API v2.0 - POST /context/retrieve
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type { ContextRequest, ContextRetrieveResponse } from '../types/context';
import { DEPTH_PRESETS } from '../types/context';
import { contextRequestSchema } from '../schemas/context';
import { InputValidationError } from '../errors/validation';

/**
 * Service for aggregated context retrieval.
 *
 * This is the core API surface for Chat main flows. A single call to
 * {@link ContextService.retrieve} fetches user profile memories,
 * conversation history, and knowledge graph data in parallel.
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_test_abc123' });
 *
 * const context = await nexus.context.retrieve({
 *   user_id: 'user_42',
 *   query: 'What did we discuss about the project?',
 *   layers: ['recent', 'semantic', 'graph'],
 * });
 *
 * console.log(context.profile?.memories);
 * console.log(context.history?.messages);
 * console.log(context.graph?.entities);
 * ```
 */
export class ContextService extends BaseService {
  /**
   * Retrieve aggregated context for a user across multiple layers.
   *
   * Performs v2.0 three-layer parallel retrieval:
   * - **recent**: Time-anchored activities from the activity stream
   * - **semantic**: Vector similarity search against Mem0 memory store
   * - **graph**: Knowledge graph traversal via Fast GraphRAG
   *
   * @param request - Context retrieval parameters including user_id, query, and layer configuration.
   * @returns Aggregated context containing profile, history, graph, and performance metadata.
   */
  async retrieve(request: ContextRequest, options?: RequestOptions): Promise<ContextRetrieveResponse> {
    // Resolve depth preset: preset values are the base, explicit caller fields win.
    let resolved: ContextRequest;
    if (request.depth !== undefined && DEPTH_PRESETS[request.depth]) {
      const { depth, ...rest } = request;
      resolved = { ...DEPTH_PRESETS[depth], ...rest };
    } else {
      const { depth: _depth, ...rest } = request;
      resolved = rest;
    }

    const parsed = contextRequestSchema.safeParse(resolved);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<ContextRetrieveResponse>('/context/retrieve', resolved, options?.signal);
  }
}
