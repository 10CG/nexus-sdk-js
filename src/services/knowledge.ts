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
  KnowledgeEntity,
  ExtractionRequest,
  ExtractionResult,
  EntityListResponse,
  GraphQueryRequest,
  GraphQueryResponse,
} from '../types/knowledge';
import { entityCreateSchema, graphQueryRequestSchema, extractionRequestSchema } from '../schemas/knowledge';
import { InputValidationError } from '../errors/validation';

/**
 * Request payload for creating a new knowledge entity.
 *
 * POST /knowledge/entities
 */
export interface EntityCreate {
  /** Entity display name */
  name: string;
  /** Entity type classification (e.g., Person, Organization, Concept) */
  entity_type: string;
  /** Entity description */
  description?: string;
  /** Additional entity properties */
  properties?: Record<string, unknown>;
}

/**
 * Parameters for listing knowledge entities with optional filtering.
 */
export interface EntityListParams {
  /** Filter entities by user ID (owner) */
  user_id?: string;
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
 * Provides entity CRUD, BFS graph traversal queries, and automatic
 * entity/relationship extraction from unstructured text. Supports
 * both public (agent-owned) and private (user-owned) knowledge.
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
   * Create a new knowledge entity in the graph.
   *
   * @param data - Entity creation payload including name, type, and optional description/properties.
   * @returns The newly created entity with generated entity_id.
   */
  async createEntity(data: EntityCreate, options?: RequestOptions): Promise<KnowledgeEntity> {
    const parsed = entityCreateSchema.safeParse(data);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<KnowledgeEntity>('/knowledge/entities', data, options?.signal);
  }

  /**
   * List knowledge entities with optional filtering.
   *
   * @param params - Optional filters for user_id, entity_type, and pagination controls.
   * @returns Paginated list of knowledge entities.
   */
  async listEntities(params?: EntityListParams, options?: RequestOptions): Promise<EntityListResponse> {
    return this.http.get<EntityListResponse>('/knowledge/entities', params as Record<string, unknown>, options?.signal);
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
