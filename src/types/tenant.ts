/**
 * @nexus/sdk - Tenant Types
 *
 * Type definitions for the Tenant management service.
 * Supports multi-tenant isolation, API key management,
 * quota tracking, and usage statistics.
 *
 * Based on Nexus API v2.0 OpenAPI specification.
 */

// ============== Tenant Tier ==============

/** Available tenant subscription tiers */
export type TenantTier = 'free' | 'starter' | 'pro' | 'enterprise';

/** API Key permission scopes */
export type ApiKeyScope = 'read' | 'write' | 'admin';

// ============== Tenant ==============

/**
 * Tenant quotas configuration defining resource limits.
 */
export interface TenantQuotas {
  /** Maximum number of memories allowed */
  max_memories?: number;
  /** Maximum number of conversations allowed */
  max_conversations?: number;
  /** Maximum API calls per day */
  max_api_calls_per_day?: number;
}

/**
 * Current resource usage counts for a tenant.
 */
export interface TenantUsage {
  /** Current number of memories stored */
  memories_count?: number;
  /** Current number of conversations */
  conversations_count?: number;
  /** API calls made today */
  api_calls_today?: number;
}

/**
 * A tenant (organization) on the Nexus platform.
 * Each tenant has isolated data and configurable quotas.
 *
 * GET /tenants/me
 */
export interface Tenant {
  /** Unique tenant identifier (UUID) */
  id: string;
  /** Tenant display name */
  name: string;
  /** Subscription tier */
  tier: TenantTier;
  /** Resource quotas */
  quotas?: TenantQuotas;
  /** Current resource usage */
  usage?: TenantUsage;
  /** Timestamp when the tenant was created (ISO 8601) */
  created_at: string;
}

// ============== API Keys ==============

/**
 * An API key for authenticating with the Nexus platform.
 * The full key value is only returned once at creation time.
 *
 * GET /tenants/me/api-keys
 */
export interface ApiKey {
  /** Unique API key identifier (UUID) */
  id: string;
  /** API key prefix for identification (e.g., "nx_live_...abc123") */
  key_prefix: string;
  /** Human-readable name for the API key */
  name: string;
  /** Permission scopes granted to this key */
  scopes: ApiKeyScope[];
  /** Expiration timestamp (null = never expires) (ISO 8601) */
  expires_at?: string | null;
  /** Last time this key was used (ISO 8601) */
  last_used_at?: string | null;
  /** Timestamp when the key was created (ISO 8601) */
  created_at: string;
}

/**
 * Request payload for creating a new API key.
 *
 * POST /tenants/me/api-keys
 */
export interface ApiKeyCreate {
  /** Human-readable name for the API key (1-100 characters) */
  name: string;
  /**
   * Permission scopes for the key.
   * @default ["read", "write"]
   */
  scopes?: ApiKeyScope[];
  /**
   * Number of days until the key expires.
   * Omit for a key that never expires.
   * @minimum 1
   * @maximum 365
   */
  expires_days?: number;
}

/**
 * Response from creating a new API key.
 * Contains the full key value which is only shown once.
 */
export interface ApiKeyCreated extends ApiKey {
  /**
   * Full API key value.
   * Format: nx_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   * WARNING: This value is only returned once at creation time.
   */
  key: string;
}

// ============== Usage Statistics ==============

/**
 * Usage statistics for a tenant over a specific time period.
 *
 * GET /tenants/me/usage
 */
export interface UsageStats {
  /** Time period for the statistics */
  period: 'day' | 'week' | 'month';
  /** Total API calls in the period */
  api_calls: number;
  /** Total tokens consumed */
  tokens_used?: number;
  /** Number of memories created in the period */
  memories_created?: number;
  /** Number of conversations created in the period */
  conversations_created?: number;
}
