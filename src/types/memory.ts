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
 * Represents a single piece of user knowledge managed by Mem0.
 */
export interface Memory {
  /** Unique memory identifier (UUID) */
  id: string;
  /** User ID that owns this memory */
  user_id: string;
  /** Memory content text */
  content: string;
  /** Classification of the memory */
  memory_type: MemoryType;
  /** Additional metadata key-value pairs */
  metadata?: Record<string, unknown>;
  /** Relevance score (present in search results) */
  score?: number;
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
 * Response from a semantic memory search operation.
 */
export interface MemorySearchResult {
  /** Array of matching memories (with score populated) */
  results: Memory[];
  /** Original search query */
  query: string;
  /** Search execution time in milliseconds */
  took_ms: number;
}

// ============== Memory List ==============

/**
 * Paginated list of memories.
 *
 * GET /memories?user_id=...
 */
export interface MemoryList {
  /** Array of memory records */
  data: Memory[];
  /** Pagination metadata */
  pagination: {
    /** Total number of memories */
    total: number;
    /** Current page size limit */
    limit: number;
    /** Current offset */
    offset: number;
    /** Whether more results exist */
    has_more: boolean;
  };
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
