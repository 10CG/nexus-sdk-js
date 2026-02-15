/**
 * @module services/memories
 * @description Memory Service - Long-term memory management with semantic retrieval.
 *
 * Wraps the Nexus Memory API powered by Mem0. Supports CRUD operations
 * on episodic, semantic, and procedural memories, vector similarity
 * search, and the Memory Journal view (US-015).
 *
 * Based on Nexus API v2.0 - /memories endpoints
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type {
  Memory,
  MemoryCreate,
  MemoryUpdate,
  MemorySearch,
  MemorySearchResult,
  MemoryList,
  JournalResponse,
  MemoryType,
} from '../types/memory';
import { memoryCreateSchema, memoryUpdateSchema, memorySearchSchema } from '../schemas/memory';
import { InputValidationError } from '../errors/validation';

/**
 * Parameters for listing memories with optional filtering and pagination.
 */
export interface MemoryListParams {
  /** Filter memories by user ID */
  user_id?: string;
  /** Filter by memory type classification */
  memory_type?: MemoryType;
  /** Maximum number of results per page */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

/**
 * Parameters for the Memory Journal view (US-015).
 */
export interface MemoryJournalParams {
  /** Response format: markdown for display, json for programmatic use */
  format?: 'markdown' | 'json';
  /** Start date filter (ISO 8601 date, e.g. "2026-01-01") */
  start_date?: string;
  /** End date filter (ISO 8601 date, e.g. "2026-01-31") */
  end_date?: string;
  /** Filter journal entries by user ID */
  user_id?: string;
}

/**
 * Service for managing long-term memories via Mem0.
 *
 * Provides full CRUD operations, semantic search, and the chronological
 * Memory Journal view for reviewing memories over time.
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_test_abc123' });
 *
 * // Create a memory
 * const memory = await nexus.memories.create({
 *   user_id: 'user_42',
 *   content: 'User prefers dark mode',
 *   memory_type: 'semantic',
 * });
 *
 * // Semantic search
 * const results = await nexus.memories.search({
 *   user_id: 'user_42',
 *   query: 'UI preferences',
 * });
 * ```
 */
export class MemoryService extends BaseService {
  /**
   * Create a new memory record.
   *
   * @param data - Memory creation payload including user_id, content, and optional type/metadata.
   * @returns The newly created memory with generated ID and timestamps.
   */
  async create(data: MemoryCreate, options?: RequestOptions): Promise<Memory> {
    const parsed = memoryCreateSchema.safeParse(data);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<Memory>('/memories', data, options?.signal);
  }

  /**
   * List memories with optional filtering and pagination.
   *
   * @param params - Optional filters for user_id, memory_type, and pagination controls.
   * @returns Paginated list of memory records.
   */
  async list(params?: MemoryListParams, options?: RequestOptions): Promise<MemoryList> {
    return this.http.get<MemoryList>('/memories', params as Record<string, unknown>, options?.signal);
  }

  /**
   * Retrieve a single memory by its ID.
   *
   * @param memoryId - UUID of the memory to retrieve.
   * @returns The memory record.
   * @throws {ApiError} 404 if the memory does not exist.
   */
  async get(memoryId: string, options?: RequestOptions): Promise<Memory> {
    return this.http.get<Memory>(`/memories/${memoryId}`, undefined, options?.signal);
  }

  /**
   * Update an existing memory record.
   *
   * Supports partial updates -- only the provided fields are modified.
   *
   * @param memoryId - UUID of the memory to update.
   * @param data - Fields to update (content, memory_type, metadata).
   * @returns The updated memory record.
   * @throws {ApiError} 404 if the memory does not exist.
   */
  async update(memoryId: string, data: MemoryUpdate, options?: RequestOptions): Promise<Memory> {
    const parsed = memoryUpdateSchema.safeParse(data);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.patch<Memory>(`/memories/${memoryId}`, data, options?.signal);
  }

  /**
   * Delete a memory record.
   *
   * @param memoryId - UUID of the memory to delete.
   * @throws {ApiError} 404 if the memory does not exist.
   */
  async delete(memoryId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete<void>(`/memories/${memoryId}`, options?.signal);
  }

  /**
   * Perform semantic similarity search across memories.
   *
   * Uses Mem0's vector search to find memories relevant to the query text.
   * Results are ranked by similarity score and filtered by optional thresholds.
   *
   * @param request - Search parameters including user_id, query, and optional filters.
   * @returns Search results with scored memories and timing metadata.
   */
  async search(request: MemorySearch, options?: RequestOptions): Promise<MemorySearchResult> {
    const parsed = memorySearchSchema.safeParse(request);
    if (!parsed.success) {
      throw new InputValidationError(parsed.error);
    }
    return this.http.post<MemorySearchResult>('/memories/search', request, options?.signal);
  }

  /**
   * Retrieve the Memory Journal view (US-015).
   *
   * Groups memories chronologically by date for review. Supports both
   * markdown (human-readable) and JSON (programmatic) output formats.
   *
   * @param params - Optional filters for format, date range, and user_id.
   * @returns Journal response with memories grouped by date.
   */
  async journal(params?: MemoryJournalParams, options?: RequestOptions): Promise<JournalResponse> {
    return this.http.get<JournalResponse>('/memories/journal', params as Record<string, unknown>, options?.signal);
  }
}
