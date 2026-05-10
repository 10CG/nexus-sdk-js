/**
 * @nexus/sdk - Context Types
 *
 * Type definitions for the Context Service - the core aggregated context
 * retrieval API used in Chat main flows.
 *
 * v2.0 DX Enhanced temporal-anchored multi-layer retrieval.
 *
 * Based on Nexus API v2.0 OpenAPI specification.
 */

// ============== Context Layers (v2.0 DX Enhancement) ==============

/**
 * Available context retrieval layers for multi-layer parallel retrieval.
 * - "recent": Time-anchored activities from the activity stream
 * - "semantic": Vector similarity search against memory store (Mem0)
 * - "graph": Knowledge graph traversal (Fast GraphRAG)
 */
export type ContextLayer = 'recent' | 'semantic' | 'graph';

// ============== Context Depth Presets ==============

/**
 * Convenience depth levels for context retrieval.
 *
 * | Level | Profile | History | Graph | Layers            |
 * |-------|---------|---------|-------|-------------------|
 * | L0    | 1 mem   | off     | off   | []                |
 * | L1    | 3 mems  | off     | off   | []                |
 * | L2    | 10 mems | off     | off   | ["semantic"]      |
 * | L3    | 20 mems | on      | on    | ["semantic","graph"] |
 *
 * Use with the `depth` parameter on {@link ContextRequest}.
 * Explicit fields always override the preset values.
 */
export type ContextDepth = 'L0' | 'L1' | 'L2' | 'L3';

/** @internal Partial ContextRequest overrides applied for each depth preset. */
export type ContextDepthPreset = Pick<
  ContextRequest,
  'include_profile' | 'profile_limit' | 'include_history' | 'include_graph' | 'layers'
>;

/**
 * Preset field overrides for each {@link ContextDepth} level.
 * Applied before user-supplied options so explicit values always win.
 */
export const DEPTH_PRESETS: Record<ContextDepth, ContextDepthPreset> = {
  L0: { include_profile: true, profile_limit: 1,  include_history: false, include_graph: false, layers: [] },
  L1: { include_profile: true, profile_limit: 3,  include_history: false, include_graph: false, layers: [] },
  L2: { include_profile: true, profile_limit: 10, include_history: false, include_graph: false, layers: ['semantic'] },
  L3: { include_profile: true, profile_limit: 20, include_history: true,  include_graph: true,  layers: ['semantic', 'graph'] },
};

// ============== Context Request (v2.0 DX Enhanced) ==============

/**
 * Request payload for the v2.0 DX Enhanced context retrieval endpoint.
 * Supports multi-layer parallel retrieval with temporal anchoring (US-014).
 *
 * POST /context/retrieve
 *
 * The optional `depth` field is a client-side convenience shorthand.
 * It is resolved to concrete field values before the request is sent to the
 * backend, so it never appears in the wire payload.
 */
export interface ContextRequest {
  /**
   * Convenience depth preset. When set, applies a predefined combination of
   * `include_profile`, `profile_limit`, `include_history`, `include_graph`,
   * and `layers`. Any field you supply explicitly overrides the preset value.
   *
   * @see {@link DEPTH_PRESETS} for exact values per level.
   */
  depth?: ContextDepth;
  /** User ID within the tenant (Nexus auto-prefixes tenant ID) */
  user_id: string;
  /** Optional semantic query text (used for the semantic layer) */
  query?: string;
  /**
   * Context layers to retrieve in parallel.
   * @default ["semantic", "graph"]
   */
  layers?: ContextLayer[];
  /**
   * Time window for the recent layer in hours.
   * @default 4
   */
  recent_hours?: number;
  /**
   * Maximum number of recent activities to return.
   * @default 10
   */
  recent_limit?: number;
  /**
   * Whether to include memory profile (semantic layer).
   * @default true
   */
  include_profile?: boolean;
  /**
   * Maximum number of profile memories to return.
   * @default 5
   */
  profile_limit?: number;
  /**
   * Whether to include conversation history.
   * @default true
   */
  include_history?: boolean;
  /**
   * Maximum number of conversation history messages to return.
   * @default 10
   */
  history_limit?: number;
  /**
   * Whether to include knowledge graph entities (graph layer).
   * @default true
   */
  include_graph?: boolean;
  /**
   * Maximum number of knowledge graph entities to return.
   * @default 5
   */
  graph_limit?: number;
  /**
   * Optional point-in-time anchor for temporal-aware retrieval.
   * RFC 3339 datetime **with timezone offset** (e.g.
   * `"2026-01-01T00:00:00+00:00"` or `"2026-01-01T00:00:00Z"`).
   * When set, layers that support temporal anchoring (semantic, recent)
   * scope their retrieval to facts known to the system at that
   * timestamp — useful for replaying past states (debugging,
   * compliance) or running deterministic evaluations against
   * a historical snapshot.
   *
   * Naive datetimes (no timezone) are rejected client-side by the
   * zod schema to prevent silent UTC vs local-time mismatches at
   * the ingest boundary.
   *
   * @since 1.3.0 (US-037 Wave 1 TASK-005)
   */
  as_of?: string;
}

// ============== Context Response Sub-types ==============

/**
 * A single memory item within the context profile.
 * Sourced from Mem0 memory store.
 */
export interface ContextMemory {
  /** Unique memory identifier (UUID) */
  id: string;
  /** Memory content text */
  content: string;
  /** Type of memory */
  memory_type: 'episodic' | 'semantic' | 'procedural';
  /** Relevance score from similarity search */
  score?: number;
  /** Timestamp when the memory was created (ISO 8601) */
  created_at: string;
}

/**
 * User profile memories section of the context response.
 * Contains memories retrieved from Mem0.
 */
export interface ContextProfile {
  /** List of relevant memories */
  memories: ContextMemory[];
  /** Total number of memories the user has */
  total_count: number;
}

/** A single message within conversation history. */
export interface ContextMessage {
  /** Message role */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** Message content text */
  content: string;
  /** Timestamp when the message was created (ISO 8601) */
  created_at: string;
}

/**
 * Conversation history section of the context response.
 * Sourced from Zep conversation store.
 */
export interface ContextHistory {
  /** List of recent messages */
  messages: ContextMessage[];
  /** Auto-generated conversation summary (if available) */
  summary?: string;
  /** Session identifier */
  session_id?: string;
}

/** Entity ownership type in the knowledge graph */
export type OwnerType = 'agent' | 'user';

/**
 * A knowledge entity within the graph context.
 * Sourced from Fast GraphRAG.
 */
export interface ContextEntity {
  /** Unique entity identifier (UUID) */
  id: string;
  /** Entity display name */
  name: string;
  /** Entity type classification (e.g., Person, Organization) */
  entity_type: string;
  /** Entity description */
  description?: string;
  /** Additional entity properties */
  properties?: Record<string, unknown>;
  /** Ownership type: agent=public knowledge, user=private social graph */
  owner_type?: OwnerType;
}

/** A relationship between two entities in the knowledge graph. */
export interface ContextRelation {
  /** Source entity name */
  source: string;
  /** Relationship type label */
  relation: string;
  /** Target entity name */
  target: string;
  /** Relationship weight/strength */
  weight?: number;
}

/**
 * Knowledge graph section of the context response.
 * Sourced from Fast GraphRAG.
 */
export interface ContextGraph {
  /** List of relevant entities */
  entities: ContextEntity[];
  /** List of relationships between entities */
  relations: ContextRelation[];
}

/**
 * Retrieval performance metadata.
 * Provides timing information for each retrieval layer.
 */
export interface ContextMeta {
  /** Total retrieval time in milliseconds */
  took_ms: number;
  /** Memory retrieval time in milliseconds */
  memory_took_ms?: number;
  /** History retrieval time in milliseconds */
  history_took_ms?: number;
  /** Graph retrieval time in milliseconds */
  graph_took_ms?: number;
  /** Original query text */
  query?: string;
}

// ============== Context Retrieve Response ==============

/**
 * Aggregated context response from the retrieve endpoint.
 * Contains parallel-fetched results from all requested layers.
 */
export interface ContextRetrieveResponse {
  /** User profile memories from Mem0 */
  profile?: ContextProfile;
  /** Conversation history from Zep */
  history?: ContextHistory;
  /** Knowledge graph data from GraphRAG */
  graph?: ContextGraph;
  /** Retrieval performance metadata */
  meta?: ContextMeta;
}
