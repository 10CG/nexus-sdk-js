/**
 * Common types
 */

/**
 * Client configuration options
 */
export interface NexusClientConfig {
  /**
   * API key for authentication
   * Format: nx_live_... or nx_test_...
   */
  apiKey: string;

  /**
   * Base URL for the API
   * @default https://api.nexus.10cg.pub/v1
   */
  baseURL?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Maximum number of retries for failed requests
   * @default 3
   */
  maxRetries?: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Maximum number of items to return */
  limit?: number;

  /** Number of items to skip */
  offset?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /** Total number of items */
  total: number;

  /** Current page limit */
  limit: number;

  /** Current offset */
  offset: number;

  /** Whether more items are available */
  hasMore: boolean;
}
