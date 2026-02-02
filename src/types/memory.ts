/**
 * Memory Service types
 */

import type { PaginationOptions } from './common';

/**
 * Memory category types
 */
export type MemoryCategory = 'episodic' | 'semantic' | 'procedural';

/**
 * Memory object
 */
export interface Memory {
  /** Memory ID (UUID) */
  id: string;

  /** Memory content text */
  content: string;

  /** Memory category */
  memory_type: MemoryCategory;

  /** Semantic similarity score (for search results) */
  score?: number;

  /** User ID */
  user_id: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Creation timestamp */
  created_at: Date;

  /** Last update timestamp */
  updated_at?: Date;
}

/**
 * Create memory DTO
 */
export interface CreateMemoryDto {
  /** Memory content */
  content: string;

  /** Memory category */
  memory_type?: MemoryCategory;

  /** User ID (compound ID: tenant_id::user_id) */
  user_id: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Search memory DTO
 */
export interface SearchMemoryDto {
  /** Search query text */
  query: string;

  /** User ID */
  user_id: string;

  /** Maximum results to return */
  limit?: number;

  /** Minimum similarity threshold (0-1) */
  threshold?: number;

  /** Filter by memory types */
  memory_types?: MemoryCategory[];
}

/**
 * Update memory DTO
 */
export interface UpdateMemoryDto {
  /** Updated memory content */
  content?: string;

  /** Updated memory category */
  memory_type?: MemoryCategory;

  /** Updated metadata */
  metadata?: Record<string, unknown>;
}
