/**
 * @module services/knowledge
 * @description Knowledge Service - Knowledge graph construction and query.
 *
 * Wraps the Nexus Knowledge API powered by Fast GraphRAG. Supports
 * entity management, graph traversal queries (BFS), and automatic
 * entity/relationship extraction from unstructured text.
 *
 * Based on Nexus API v2.0 - /knowledge endpoints
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type {
  ExtractionRequest,
  ExtractionResult,
  EntityListResponse,
  GraphQueryRequest,
  GraphQueryResponse,
} from '../types/knowledge';
import { graphQueryRequestSchema, extractionRequestSchema } from '../schemas/knowledge';
import { InputValidationError } from '../errors/validation';

// v3.0.0 BREAKING (tenant-contract-reconciliation): `EntityCreate` and
// `KnowledgeService.createEntity()` were REMOVED. The SDK method POSTed
// /knowledge/entities — a route the backend has never had (404/405 at
// runtime, a phantom endpoint; owner decision Q8-A: drop the SDK method
// rather than add a backend route).

/**
 * Parameters for listing knowledge entities.
 *
 * v3.0.0 BREAKING: `user_id` is required — the backend (and OpenAPI) demand
 * it (`Query(..., min_length=1)`); the previous optional typing let calls
 * compile that 422'd at runtime.
 */
export interface EntityListParams {
  /** Entity owner user ID (required by the backend) */
  user_id: string;
  /** Filter by entity type classification */
  entity_type?: string;
  /** Maximum number of results to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Service for managing the knowledge graph via Fast GraphRAG.
 *
 * Provides entity listing, BFS graph traversal queries, and automatic
 * entity/relationship extraction from unstructured text. Supports
 * both public (agent-owned) and private (user-owned) knowledge.
 * (v3.0.0: entity creation was removed — the backend has no
 * POST /knowledge/entities route; entities are created via extract().)
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_test_abc123' });
 *
 * // Extract entities from text
 * const extraction = await nexus.knowledge.extract({
 *   text: 'Alice works at Acme Corp on the Phoenix project.',
 *   owner_user_id: 'user_42',
 * });
 *
 * // Query the graph
 * const graph = await nexus.knowledge.query({
 *   entity_name: 'Alice',
 *   depth: 2,
 * });
 *
 * console.log(graph.paths);
 * ```
 */
export class KnowledgeService extends BaseService {
  /**
   * List knowledge entities for a user with optional filtering.
   *
   * @param params - Filters: required user_id (backend-enforced), optional entity_type and pagination controls.
   * @returns Paginated list of knowledge entities.
   */
  async listEntities(params: EntityListParams, options?: RequestOptions): Promise<EntityListResponse> {
    return this.http.get<EntityListResponse>('/knowledge/entities', params as unknown as Record<string, unknown>, options?.signal);
  }

  /**
   * Query the knowledge graph using BFS traversal.
   *
   * Starts from a named entity and traverses outward up to the specified
   * depth, collecting all reachable entities and relationships along
   * the traversal paths.
   *
   * @param request - Graph query parameters including starting entity name, depth, and optional relationship type filters.
   * @returns Graph query response with the start entity, traversal paths, and total path count.
   */
  async query(request: GraphQueryRequest, options?: RequestOptions): Promise<GraphQueryResponse> {
    const parsed = graphQueryRequestSchema.safeParse(request);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<GraphQueryResponse>('/knowledge/query', request, options?.signal);
  }

  /**
   * Extract entities and relationships from unstructured text.
   *
   * Uses Fast GraphRAG's NLP pipeline to identify named entities and
   * their relationships in Triplex format (Subject, Relation, Object).
   * Extracted items are automatically persisted to the knowledge graph.
   *
   * @param request - Extraction request including the source text and ownership (agent_id or owner_user_id).
   * @returns Extraction result with lists of created entities and relationships.
   */
  async extract(request: ExtractionRequest, options?: RequestOptions): Promise<ExtractionResult> {
    const parsed = extractionRequestSchema.safeParse(request);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<ExtractionResult>('/knowledge/extract', request, options?.signal);
  }
}
