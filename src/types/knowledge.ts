/**
 * Knowledge Service types
 */

/**
 * Owner type
 */
export type OwnerType = 'user' | 'agent';

/**
 * Knowledge extraction request
 */
export interface KnowledgeExtractDto {
  /** Text to extract entities from */
  text: string;

  /** Owner ID (user_id or agent_id) */
  owner_id: string;

  /** Owner type */
  owner_type?: OwnerType;
}

/**
 * Entity in knowledge graph
 */
export interface Entity {
  /** Entity ID */
  id: string;

  /** Entity name */
  name: string;

  /** Entity type */
  entity_type: string;

  /** Entity description */
  description?: string;

  /** Entity properties */
  properties?: Record<string, unknown>;
}

/**
 * Relationship in knowledge graph
 */
export interface Relationship {
  /** Source entity ID or name */
  source: string;

  /** Target entity ID or name */
  target: string;

  /** Relation type */
  relation_type: string;

  /** Relationship properties */
  properties?: Record<string, unknown>;
}

/**
 * Knowledge extraction result
 */
export interface KnowledgeExtractResult {
  /** Extracted entities */
  entities: Entity[];

  /** Extracted relationships */
  relationships: Relationship[];
}

/**
 * Knowledge query request
 */
export interface KnowledgeQueryDto {
  /** Query text */
  query: string;

  /** User ID */
  user_id: string;

  /** Agent ID */
  agent_id?: string;

  /** Maximum results */
  limit?: number;
}

/**
 * Knowledge query result
 */
export interface KnowledgeQueryResult {
  /** Query answer */
  answer: string;

  /** Source entities */
  sources: string[];

  /** Relevant entities */
  entities: Entity[];
}
