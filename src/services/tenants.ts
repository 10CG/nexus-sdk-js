/**
 * @module services/tenants
 * @description Tenant management service for the Nexus platform.
 *
 * Provides access to the current tenant's profile, quota configuration,
 * and usage statistics. Tenant identity is derived from the API key
 * used to authenticate requests.
 *
 * @see {@link https://docs.nexus.10cg.pub/api/tenants | Tenant API Reference}
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type { Tenant, UsageStats, ApiKey, ApiKeyCreate, ApiKeyCreated } from '../types/tenant';

/**
 * Service for managing the current tenant's profile and usage.
 *
 * The tenant is automatically identified by the API key provided
 * to the {@link NexusClient}. All methods operate on the
 * authenticated tenant's data.
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_live_...' });
 *
 * // Get tenant profile
 * const tenant = await nexus.tenants.me();
 * console.log(`Tenant: ${tenant.name} (${tenant.tier})`);
 *
 * // Check usage statistics for the last week
 * const usage = await nexus.tenants.usage('week');
 * console.log(`API calls: ${usage.api_calls} (${usage.success_rate}% ok)`);
 * ```
 */
export class TenantService extends BaseService {
  /**
   * Retrieve the current tenant's profile.
   *
   * Returns the tenant record associated with the API key,
   * including name, tier, quotas, and current usage snapshot.
   *
   * @returns The authenticated tenant's profile.
   */
  async me(options?: RequestOptions): Promise<Tenant> {
    return this.http.get<Tenant>('/tenants/me', undefined, options?.signal);
  }

  /**
   * Retrieve the current tenant's usage statistics.
   *
   * Returns API-call counts, success rate, latency percentiles, resource
   * counts, and storage usage for the requested period — the backend
   * `UsageStatsResponse` shape (v3.0.0: previously mistyped as a 3-field
   * `TenantUsage` that never matched the wire).
   *
   * @param period - Statistics window: `'day'` (default) | `'week'` | `'month'`.
   * @returns Usage statistics for the authenticated tenant.
   */
  async usage(
    period?: 'day' | 'week' | 'month',
    options?: RequestOptions,
  ): Promise<UsageStats> {
    return this.http.get<UsageStats>(
      '/tenants/me/usage',
      period ? { period } : undefined,
      options?.signal,
    );
  }

  /**
   * List all API keys for the current tenant.
   *
   * @returns Array of API key records (without full key values).
   */
  async listApiKeys(options?: RequestOptions): Promise<ApiKey[]> {
    return this.http.get<ApiKey[]>('/tenants/me/api-keys', undefined, options?.signal);
  }

  /**
   * Create a new API key for the current tenant.
   *
   * @param data - API key creation parameters (name, scopes, expiry).
   * @returns The newly created API key, including the full key value (shown only once).
   */
  async createApiKey(data: ApiKeyCreate, options?: RequestOptions): Promise<ApiKeyCreated> {
    return this.http.post<ApiKeyCreated>('/tenants/me/api-keys', data, options?.signal);
  }

  /**
   * Revoke (delete) an API key.
   *
   * @param id - The UUID of the API key to revoke.
   */
  async revokeApiKey(id: string, options?: RequestOptions): Promise<void> {
    return this.http.delete<void>(`/tenants/me/api-keys/${id}`, options?.signal);
  }
}
