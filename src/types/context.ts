/**
 * @nexusm/sdk - Context Types
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

// ============== Context Response Element Types ==============
// v2.0.0 BREAKING (contract reconciliation, ADR-003): canonical = backend flat
// element shapes. Replaces the old nested ContextProfile/ContextHistory/
// ContextGraph containers + ContextMemory/ContextMessage/ContextEntity/
// ContextRelation/ContextMeta sub-types (removed).

/**
 * A user profile memory element (`ContextRetrieveResponse.profile[]`).
 * Mirrors backend `ProfileMemory`.
 */
export interface ProfileMemory {
  /** Memory identifier */
  memory_id: string;
  /** Memory content text */
  content: string;
  /** Memory type */
  memory_type: string;
  /** Optional category */
  category?: string | null;
  /** Relevance score from similarity search */
  similarity_score?: number | null;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A conversation message element (`ContextRetrieveResponse.history[]`).
 * Mirrors backend `ConversationMessage`.
 */
export interface ConversationMessage {
  /** Message identifier */
  message_id: string;
  /** Message role */
  role: 'user' | 'assistant' | 'system' | 'tool';
  /** Message content text */
  content: string;
  /** Creation timestamp (ISO 8601) */
  created_at: string;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A knowledge graph entity element (`ContextRetrieveResponse.graph[]`).
 * Mirrors backend `ContextGraphEntity`.
 */
export interface ContextGraphEntity {
  /** Entity identifier */
  entity_id: string;
  /** Entity display name */
  name: string;
  /** Entity type classification */
  type: string;
  /** Entity description */
  description?: string | null;
  /** Relationships (free-form objects) */
  relationships?: Array<Record<string, unknown>>;
  /** Relevance score for unified ranking */
  relevance_score?: number;
}

// ============== Context Retrieve Response ==============

/**
 * Aggregated context response from the retrieve endpoint.
 *
 * **v2.0.0 BREAKING (contract reconciliation, ADR-003):** canonical = backend
 * flat-array shape. `profile`/`history`/`graph` are now flat arrays (not nested
 * `{memories,...}` containers); `meta` is removed (use `total_latency_ms`);
 * top-level diagnostic/identity fields are surfaced directly.
 */
export interface ContextRetrieveResponse {
  /** Unique retrieval ID for feedback association (PUT /feedback/{retrieve_id}, 7d window) */
  retrieve_id?: string | null;
  /** User profile memories (flat array) */
  profile?: ProfileMemory[] | null;
  /** Conversation history (flat array) */
  history?: ConversationMessage[] | null;
  /** Knowledge graph entities (flat array) */
  graph?: ContextGraphEntity[] | null;
  /** AI-synthesized user profile (free-form key-value) */
  ai_profile?: Record<string, unknown> | null;
  /** Retrieval completion timestamp (ISO 8601) */
  retrieved_at: string;
  /** Total retrieval time in milliseconds */
  total_latency_ms: number;
  /** Partial-failure errors (sub-service name -> message) */
  errors?: Record<string, string> | null;
  /** A/B experiment group assignment (US-030) */
  experiment_group?:
    | 'control'
    | 'treatment'
    | 'override_vector'
    | 'override_rerank'
    | 'error'
    | null;
  /** Count of memories removed by US-035 temporal validity filter (diagnostic; 0 = none filtered) */
  temporal_filtered_count?: number | null;
  /** Echoes the request `as_of` anchor (null for current-time retrieval) */
  as_of?: string | null;
}
