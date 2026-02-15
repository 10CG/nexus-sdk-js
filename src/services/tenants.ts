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
import type { Tenant, TenantUsage } from '../types/tenant';

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
 * // Check resource usage
 * const usage = await nexus.tenants.usage();
 * console.log(`Memories: ${usage.memories_count}`);
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
   * Retrieve the current tenant's resource usage statistics.
   *
   * Returns counts for memories, conversations, and today's API calls.
   * Useful for monitoring quota consumption and building dashboards.
   *
   * @returns Current resource usage for the authenticated tenant.
   */
  async usage(options?: RequestOptions): Promise<TenantUsage> {
    return this.http.get<TenantUsage>('/tenants/me/usage', undefined, options?.signal);
  }
}
