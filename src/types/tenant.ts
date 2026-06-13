/**
 * @nexusm/sdk - Tenant Types
 *
 * Type definitions for the Tenant management service.
 * Supports multi-tenant isolation, API key management,
 * quota tracking, and usage statistics.
 *
 * v3.0.0 BREAKING (tenant-contract-reconciliation, 2026-06-10): canonical =
 * backend Pydantic response models (`schemas/tenant.py`). The previous shapes
 * were drifted: `Tenant` had a phantom nested `usage` object (the wire is
 * flat), `UsageStats` declared 3 phantom fields and missed 11 real ones, and
 * `ApiKeyCreate` used the phantom request field `expires_days` (the wire is
 * `expires_in_days` — the old name was silently dropped by the backend,
 * creating never-expiring keys).
 */

// ============== Tenant Tier ==============

/** Available tenant subscription tiers */
export type TenantTier = 'free' | 'starter' | 'pro' | 'enterprise';

// ============== Tenant ==============

/**
 * Tenant quotas configuration defining resource limits.
 *
 * The backend serializes a free-form object; the keys below are the
 * well-known ones. Unknown keys are preserved via the index signature.
 */
export interface TenantQuotas {
  /** Maximum number of memories allowed */
  max_memories?: number;
  /** Maximum number of conversations allowed */
  max_conversations?: number;
  /** Maximum number of knowledge graph nodes allowed */
  max_graph_nodes?: number;
  /** Maximum API calls per day */
  max_api_calls_per_day?: number;
  /** Forward-compatible: any additional quota dimensions */
  [key: string]: unknown;
}

/**
 * A tenant (organization) on the Nexus platform.
 * Each tenant has isolated data and configurable quotas.
 *
 * GET /tenants/me — mirrors backend `TenantInfoResponse` (flat shape).
 *
 * v3.0.0 BREAKING: usage counts are FLAT top-level fields (the nested
 * `usage` object never existed on the wire); adds `quota_remaining` and
 * `graph_nodes_count` (previously missing).
 */
export interface Tenant {
  /** Unique tenant identifier (UUID) */
  id: string;
  /** Tenant display name */
  name: string;
  /** Subscription tier */
  tier: TenantTier;
  /** Resource quotas */
  quotas: TenantQuotas;
  /** Remaining headroom per quota dimension */
  quota_remaining: Record<string, number>;
  /** Timestamp when the tenant was created (ISO 8601) */
  created_at: string;
  /** Current number of memories stored (flat — not nested under `usage`) */
  memories_count: number;
  /** Current number of conversations (flat — not nested under `usage`) */
  conversations_count: number;
  /** Current number of knowledge graph nodes */
  graph_nodes_count: number;
}

// ============== API Keys ==============

/**
 * An API key for authenticating with the Nexus platform.
 * The full key value is only returned once at creation time.
 *
 * GET /tenants/me/api-keys
 *
 * v3.0.0: `scopes` is a free-form string array documenting backend reality —
 * known values are `"read"`, `"write"`, `"admin"` and the `"*"` wildcard
 * (the backend authorizes via `scope in scopes or "*" in scopes`). The old
 * `ApiKeyScope` enum could not represent `"*"`, the actual default.
 */
export interface ApiKey {
  /** Unique API key identifier (UUID) */
  id: string;
  /** API key prefix for identification (e.g., "nx_live_...abc123") */
  key_prefix: string;
  /** Human-readable name for the API key */
  name: string;
  /** Permission scopes granted to this key (known values: read, write, admin, "*") */
  scopes: string[];
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
 * POST /tenants/me/api-keys — mirrors backend `ApiKeyCreate`.
 *
 * v3.0.0 BREAKING: `expires_days` → `expires_in_days` (the backend request
 * field). The old name was silently ignored by the backend (no
 * `extra=forbid`), so keys created through the SDK never expired.
 */
export interface ApiKeyCreate {
  /** Human-readable name for the API key (1-255 characters) */
  name: string;
  /**
   * Permission scopes for the key (known values: read, write, admin,
   * admin:dashboard, feedback:diagnose, "*" wildcard).
   * @default ["read", "write"] — least-privilege default (backend tightened
   * in security-scopes-admin-hardening, 2026-06-11). The "*" wildcard must be
   * requested explicitly; the default intentionally omits admin:dashboard /
   * feedback:diagnose.
   */
  scopes?: string[];
  /**
   * Number of days until the key expires.
   * Omit for a key that never expires.
   * @minimum 1
   * @maximum 365
   */
  expires_in_days?: number;
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
 * GET /tenants/me/usage — mirrors backend `UsageStatsResponse` (13 fields).
 *
 * v3.0.0 BREAKING: full realignment. The previous 5-field shape declared 3
 * phantom fields (`tokens_used` / `memories_created` / `conversations_created`)
 * and missed the latency/success-rate/storage fields the backend actually
 * emits.
 */
export interface UsageStats {
  /** Tenant identifier (UUID) */
  tenant_id: string;
  /** Time period for the statistics */
  period: 'day' | 'week' | 'month';
  /** Total API calls in the period */
  api_calls: number;
  /** Success rate over the period (0-100) */
  success_rate: number;
  /** Average request latency in milliseconds */
  avg_latency_ms: number;
  /** p50 latency in milliseconds (null when no traffic) */
  p50_latency_ms?: number | null;
  /** p95 latency in milliseconds (null when no traffic) */
  p95_latency_ms?: number | null;
  /** p99 latency in milliseconds (null when no traffic) */
  p99_latency_ms?: number | null;
  /** Current number of memories stored */
  memories_count: number;
  /** Current number of conversations */
  conversations_count: number;
  /** Current number of knowledge graph nodes */
  graph_nodes_count: number;
  /** Storage consumed in bytes */
  storage_used_bytes: number;
  /** Storage limit in bytes */
  storage_limit_bytes: number;
}
