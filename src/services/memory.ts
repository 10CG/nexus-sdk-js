/**
 * Memory Service
 */

import { BaseService } from './base';
import type {
  Memory,
  CreateMemoryDto,
  SearchMemoryDto,
  UpdateMemoryDto,
} from '../types';

/**
 * Memory Service API
 */
export class MemoryService extends BaseService {
  /**
   * Create a new memory
   * @param data - Memory data to create
   * @returns Created memory object
   * @throws {ValidationError} If validation fails
   * @example
   * ```ts
   * const memory = await client.memories.create({
   *   content: 'User likes dark mode',
   *   user_id: 'user_123'
   * });
   * ```
   */
  async create(data: CreateMemoryDto): Promise<Memory> {
    return this.http.post<Memory>('/memories', data);
  }

  /**
   * Search memories by semantic similarity
   * @param data - Search parameters
   * @returns Array of memories sorted by relevance
   * @example
   * ```ts
   * const results = await client.memories.search({
   *   query: 'preferences',
   *   user_id: 'user_123',
   *   limit: 5
   * });
   * ```
   */
  async search(data: SearchMemoryDto): Promise<Memory[]> {
    return this.http.post<Memory[]>('/memories/search', data);
  }

  /**
   * Get a memory by ID
   * @param id - Memory ID
   * @returns Memory object
   */
  async get(id: string): Promise<Memory> {
    return this.http.get<Memory>(`/memories/${id}`);
  }

  /**
   * Update a memory
   * @param id - Memory ID
   * @param data - Update data
   * @returns Updated memory object
   */
  async update(id: string, data: UpdateMemoryDto): Promise<Memory> {
    return this.http.patch<Memory>(`/memories/${id}`, data);
  }

  /**
   * Delete a memory
   * @param id - Memory ID
   */
  async delete(id: string): Promise<void> {
    return this.http.delete(`/memories/${id}`);
  }

  /**
   * List memories for a user
   * @param userId - User ID
   * @param params - Query parameters
   * @returns Array of memories
   */
  async list(
    userId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<Memory[]> {
    return this.http.get<Memory[]>('/memories', {
      user_id: userId,
      ...params,
    });
  }
}
