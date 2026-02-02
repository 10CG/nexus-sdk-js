/**
 * Context Service types
 */

/**
 * Context retrieval options
 */
export interface ContextRetrieveOptions {
  /** Maximum memories to retrieve */
  memory_limit?: number;

  /** Filter by memory types */
  memory_types?: string[];

  /** Minimum similarity threshold */
  memory_threshold?: number;

  /** Maximum messages to retrieve */
  history_limit?: number;

  /** Include knowledge graph */
  include_graph?: boolean;

  /** Graph traversal depth */
  graph_depth?: number;
}

/**
 * Context retrieval request
 */
export interface ContextRetrieveDto {
  /** User ID */
  user_id: string;

  /** Session ID */
  session_id?: string;

  /** Agent ID */
  agent_id?: string;

  /** Query for context retrieval */
  query: string;

  /** Retrieval options */
  options?: ContextRetrieveOptions;
}

/**
 * Context memory profile
 */
export interface ContextProfile {
  /** Retrieved memories */
  memories: ContextMemory[];

  /** Total memory count */
  total_count: number;
}

/**
 * Context memory
 */
export interface ContextMemory {
  /** Memory ID */
  id: string;

  /** Memory content */
  content: string;

  /** Memory type */
  memory_type: string;

  /** Similarity score */
  score?: number;

  /** Creation timestamp */
  created_at: Date;
}

/**
 * Context conversation history
 */
export interface ContextHistory {
  /** Conversation messages */
  messages: ContextMessage[];

  /** Conversation summary (if available) */
  summary?: string;

  /** Session ID */
  session_id: string;

  /** Conversation ID */
  conversation_id?: string;
}

/**
 * Context message
 */
export interface ContextMessage {
  /** Message role */
  role: string;

  /** Message content */
  content: string;

  /** Creation timestamp */
  created_at: Date;
}

/**
 * Context knowledge graph
 */
export interface ContextGraph {
  /** Graph entities */
  entities: ContextEntity[];

  /** Graph relationships */
  relations: ContextRelation[];
}

/**
 * Context entity
 */
export interface ContextEntity {
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
 * Context relationship
 */
export interface ContextRelation {
  /** Source entity ID */
  source: string;

  /** Target entity ID */
  target: string;

  /** Relation type */
  relation_type: string;

  /** Relation properties */
  properties?: Record<string, unknown>;
}

/**
 * Context retrieval response
 */
export interface ContextRetrieveResponse {
  /** User memory profile */
  profile?: ContextProfile;

  /** Conversation history */
  history?: ContextHistory;

  /** Knowledge graph */
  graph?: ContextGraph;

  /** Response metadata */
  meta?: {
    /** Retrieval time in milliseconds */
    retrieval_time_ms: number;

    /** Data sources included */
    sources: string[];
  };
}
