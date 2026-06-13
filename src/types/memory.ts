/**
 * @nexusm/sdk - Memory Types
 *
 * Type definitions for the Memory Service powered by Mem0.
 * Supports episodic, semantic, and procedural memory types
 * with vector similarity search.
 *
 * Based on Nexus API v2.0 OpenAPI specification.
 */

// ============== Memory Type ==============

/** Classification of memory types stored in Mem0 */
export type MemoryType = 'episodic' | 'semantic' | 'procedural';

// ============== Memory CRUD ==============

/**
 * A memory record stored in the Nexus platform.
 *
 * Mirrors backend `MemoryResponse` (schemas/memory.py, 14 fields).
 *
 * v4.0.0 (memory-conversation-contract-reconciliation): adds the
 * compound-identifier trio (`memory_id` / `tenant_id` / `agent_id`) and the
 * US-035 temporal-validity window (`valid_from` / `valid_until` /
 * `valid_until_source`) — all emitted by the backend but previously missing
 * from this type (readers got `undefined`).
 */
export interface Memory {
  /** Compound memory ID ("tenant::user::uuid") — needed for multi-tenant ops */
  memory_id: string;
  /** Unique memory identifier (UUID) */
  id: string;
  /** Tenant identifier */
  tenant_id: string;
  /** User ID that owns this memory */
  user_id: string;
  /** Originating agent (null when not agent-written) */
  agent_id?: string | null;
  /** Memory content text */
  content: string;
  /** Classification of the memory */
  memory_type: MemoryType;
  /** Additional metadata key-value pairs */
  metadata?: Record<string, unknown>;
  /** Relevance score (present in search results) */
  score?: number | null;
  /** Start of the temporal validity window (inclusive; server-managed) */
  valid_from?: string | null;
  /** End of the temporal validity window (exclusive; null = permanent) */
  valid_until?: string | null;
  /** Provenance of valid_until (permanent / extracted / sdk_provided / ...) */
  valid_until_source?: string | null;
  /** Timestamp when the memory was created (ISO 8601) */
  created_at: string;
  /** Timestamp when the memory was last updated (ISO 8601) */
  updated_at: string;
}

/**
 * Request payload for creating a new memory.
 *
 * POST /memories
 */
export interface MemoryCreate {
  /** User ID to associate the memory with */
  user_id: string;
  /** Memory content text (1-10000 characters) */
  content: string;
  /**
   * Classification of the memory.
   * @default "episodic"
   */
  memory_type?: MemoryType;
  /** Additional metadata key-value pairs */
  metadata?: Record<string, unknown>;
}

/**
 * Request payload for updating an existing memory.
 *
 * PATCH /memories/:memory_id
 */
export interface MemoryUpdate {
  /** Updated memory content text */
  content?: string;
  /** Updated memory type classification */
  memory_type?: MemoryType;
  /** Updated metadata (replaces existing metadata) */
  metadata?: Record<string, unknown>;
}

// ============== Memory Search ==============

/**
 * Request payload for semantic memory search.
 *
 * POST /memories/search
 */
export interface MemorySearch {
  /** User ID to search within */
  user_id: string;
  /** Semantic search query text */
  query: string;
  /** Filter by memory type */
  memory_type?: MemoryType;
  /**
   * Maximum number of results to return.
   * @default 10
   * @minimum 1
   * @maximum 50
   */
  limit?: number;
  /**
   * Minimum similarity score threshold.
   * @default 0.7
   * @minimum 0
   * @maximum 1
   */
  threshold?: number;
}

/**
 * A single semantic-search result element (`MemorySearchResult.results[]`).
 * Mirrors backend `SearchResult` (flat — not a nested `Memory` object).
 *
 * @since 2.0.0
 */
export interface SearchResult {
  /** Memory identifier */
  memory_id: string;
  /** Memory content text */
  content: string;
  /** Memory type */
  memory_type: string;
  /** Similarity score (0..1) */
  similarity: number;
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Response from a semantic memory search operation.
 *
 * **v2.0.0 BREAKING (contract reconciliation, ADR-003):** canonical = backend
 * `MemorySearchResponse`. `results` is now a flat `SearchResult[]` (not
 * `Memory[]`); `took_ms` renamed `search_time_ms`; `total_found` added.
 * (Backend response_model is named `MemorySearchResponse`; this SDK type keeps
 * the name `MemorySearchResult` — shapes are identical.)
 */
export interface MemorySearchResult {
  /** Matching results (flat) */
  results: SearchResult[];
  /** Original search query */
  query: string;
  /** Total number of matches found */
  total_found: number;
  /** Search execution time in milliseconds */
  search_time_ms: number;
}

// ============== Memory List ==============

/**
 * Paginated list of memories.
 *
 * GET /memories?user_id=... — mirrors backend `MemoryListResponse` (FLAT
 * container).
 *
 * v5.0.0 BREAKING: was nested `{data, pagination:{total, limit, offset,
 * has_more}}` — that shape never existed on the wire. The backend response
 * is flat `{memories, total_count, limit, offset, has_next}`; the old nested
 * shape meant `result.data` was always `undefined` at runtime.
 */
export interface MemoryList {
  /** Array of memory records */
  memories: Memory[];
  /** Total number of memories matching the query */
  total_count: number;
  /** Current page size limit */
  limit: number;
  /** Current offset */
  offset: number;
  /** Whether more results exist beyond this page */
  has_next: boolean;
}

// ============== Memory Journal (US-015) ==============

/**
 * A single journal entry representing a memory on a specific date.
 * Used in the Memory Journal view (US-015).
 */
export interface JournalEntry {
  /** Date key in YYYY-MM-DD format */
  date: string;
  /** Memories created on this date */
  memories: Memory[];
  /** Number of memories on this date */
  count: number;
}

/**
 * Response from the memory journal endpoint.
 * Groups memories by date for chronological review.
 *
 * GET /memories/journal
 */
export interface JournalResponse {
  /** User ID for the journal */
  user_id: string;
  /** Start date of the journal range (ISO 8601 date) */
  start_date: string;
  /** End date of the journal range (ISO 8601 date) */
  end_date: string;
  /** Memories grouped by date (key: YYYY-MM-DD, value: Memory[]) */
  entries: Record<string, Memory[]>;
  /** Total number of days with memories */
  total_days: number;
  /** Total number of memories in the range */
  total_memories: number;
}
