/**
 * @nexus/sdk - Common Types
 *
 * Shared type definitions used across all Nexus SDK modules.
 * Based on Nexus API v2.0 OpenAPI specification.
 */

// ============== Offline ==============

/**
 * Configuration for offline request queuing.
 * When enabled, requests made while offline are queued and replayed on reconnect.
 */
export interface OfflineConfig {
  /** Whether offline queuing is enabled. */
  enabled: boolean;
  /**
   * Maximum number of requests to buffer while offline.
   * @default 100
   */
  maxQueueSize?: number;
}

// ============== Configuration ==============

/**
 * Cache configuration for the SDK client.
 * Controls in-memory caching behavior for API responses.
 */
export interface CacheConfig {
  /** Maximum number of cached entries */
  max: number;
  /** Time-to-live in milliseconds */
  ttl: number;
}

/**
 * Retry configuration for failed API requests.
 * Implements exponential backoff strategy.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay between retries in milliseconds */
  initialDelay: number;
  /** Maximum delay between retries in milliseconds */
  maxDelay: number;
  /** Multiplier applied to delay after each retry */
  backoffFactor: number;
}

/**
 * Main configuration for the Nexus SDK client.
 * Required to initialize the NexusClient instance.
 */
export interface NexusConfig {
  /**
   * API key for authentication.
   * Format: `nx_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (production)
   * or `nx_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (test)
   */
  apiKey: string;
  /**
   * Base URL of the Nexus API.
   * @default "http://localhost:8001/v1"
   */
  baseUrl?: string;
  /** Cache configuration for API responses */
  cache?: CacheConfig;
  /** Retry configuration for failed requests */
  retry?: RetryConfig;
  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeout?: number;
  /** Offline queue configuration. */
  offline?: OfflineConfig;
}

// ============== Compound ID ==============

/**
 * Compound ID used for multi-tenant isolation.
 * Format: `tenant_id::user_id`
 */
export type CompoundId = `${string}::${string}`;

// ============== Sort & Pagination ==============

/** Sort order for list queries */
export type SortOrder = 'asc' | 'desc';

/**
 * Pagination metadata returned with list responses.
 * Follows the Nexus API pagination contract.
 */
export interface Pagination {
  /** Total number of items across all pages */
  total: number;
  /** Number of items per page */
  limit: number;
  /** Current offset from the beginning */
  offset: number;
  /** Whether more items exist beyond the current page */
  has_more: boolean;
}

/**
 * Generic paginated response wrapper.
 * Used for all list endpoints that support pagination.
 *
 * @typeParam T - The type of items in the data array
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];
  /** Pagination metadata */
  pagination: Pagination;
}

/**
 * Generic API response wrapper.
 * Used for endpoints that return a single resource or operation result.
 *
 * @typeParam T - The type of the response data
 */
export interface ApiResponse<T> {
  /** Response payload */
  data: T;
  /** Optional metadata about the response */
  meta?: Record<string, unknown>;
}

// ============== Error ==============

/**
 * Structured error detail returned by the Nexus API.
 */
export interface ApiErrorDetail {
  /** Machine-readable error code (e.g., "VALIDATION_ERROR", "UNAUTHORIZED") */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error context */
  details?: Record<string, unknown>;
}

/**
 * Top-level error response from the Nexus API.
 * All 4xx and 5xx responses follow this structure.
 */
export interface ApiError {
  error: ApiErrorDetail;
}

// ============== Health ==============

/** Service health status */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/** Individual service availability */
export type ServiceStatus = 'up' | 'down';

/**
 * Health check response from the `/health` endpoint.
 */
export interface HealthResponse {
  /** Overall platform health status */
  status: HealthStatus;
  /** Platform version string */
  version: string;
  /** Timestamp of the health check */
  timestamp: string;
  /** Status of individual backing services */
  services: {
    database: ServiceStatus;
    ollama: ServiceStatus;
  };
}
