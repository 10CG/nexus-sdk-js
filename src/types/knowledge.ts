/**
 * @nexus/sdk - Knowledge Types
 *
 * Type definitions for the Knowledge Service powered by Fast GraphRAG.
 * Supports entity extraction, relationship mapping, and graph traversal queries.
 *
 * Based on Nexus API v2.0 OpenAPI specification.
 */

// ============== Knowledge Entity ==============

/**
 * A knowledge entity in the graph.
 * Represents a named concept, person, organization, or other entity.
 */
export interface KnowledgeEntity {
  /** Unique entity identifier */
  entity_id: string;
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
 * A relationship between two knowledge entities.
 * Follows the Triplex format: (Subject, Relation, Object).
 */
export interface KnowledgeRelationship {
  /** Source entity name (Subject) */
  source: string;
  /** Target entity name (Object) */
  target: string;
  /** Relationship type label (Relation) */
  relationship_type: string;
  /** Additional relationship properties */
  properties?: Record<string, unknown>;
}

// ============== Entity Extraction ==============

/**
 * Request payload for extracting entities and relationships from text.
 *
 * POST /knowledge/extract
 */
export interface ExtractionRequest {
  /** Text to extract entities from (1-10000 characters) */
  text: string;
  /** Agent ID for public/shared knowledge (mutually exclusive with owner_user_id) */
  agent_id?: string;
  /** User ID for private knowledge/social graph (mutually exclusive with agent_id) */
  owner_user_id?: string;
}

/**
 * Response from entity extraction operation.
 */
export interface ExtractionResult {
  /** Extracted entities */
  entities: KnowledgeEntity[];
  /** Extracted relationships in Triplex format */
  relationships: KnowledgeRelationship[];
  /** Number of new entities created */
  entities_created: number;
  /** Number of new relationships created */
  relationships_created: number;
}

// ============== Entity List ==============

/**
 * Paginated list of knowledge entities.
 *
 * GET /knowledge/entities?user_id=...
 */
export interface EntityListResponse {
  /** Array of entity records */
  entities: KnowledgeEntity[];
  /** Total number of entities */
  total_count: number;
  /** Current page size limit */
  limit: number;
  /** Current offset */
  offset: number;
  /** Whether more results exist */
  has_next: boolean;
}

// ============== Graph Query ==============

/**
 * Request payload for querying the knowledge graph.
 * Uses BFS traversal from a starting entity.
 *
 * POST /knowledge/query
 */
export interface GraphQueryRequest {
  /** Starting entity name for graph traversal */
  entity_name: string;
  /**
   * Maximum traversal depth from the starting entity.
   * @default 1
   * @minimum 1
   * @maximum 3
   */
  depth?: number;
  /** Filter by specific relationship types (optional) */
  relationship_types?: string[];
}

/** Entity reference within a graph path */
export interface GraphPathEntity {
  /** Entity identifier */
  entity_id: string;
  /** Entity display name */
  name: string;
  /** Entity type classification */
  type: string;
}

/** Relationship reference within a graph path */
export interface GraphPathRelationship {
  /** Relationship identifier */
  relationship_id: string;
  /** Relationship type label */
  type: string;
}

/** A single traversal path in the graph query result */
export interface GraphPath {
  /** Depth of this path from the starting entity */
  depth: number;
  /** Entities along this path */
  entities: GraphPathEntity[];
  /** Relationships along this path */
  relationships: GraphPathRelationship[];
}

/**
 * Response from a graph query operation.
 */
export interface GraphQueryResponse {
  /** The starting entity (null if not found) */
  start_entity: GraphPathEntity | null;
  /** Traversal paths from the starting entity */
  paths: GraphPath[];
  /** Total number of paths found */
  total_paths: number;
}
