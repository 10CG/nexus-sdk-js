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
