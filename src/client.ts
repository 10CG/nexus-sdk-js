/**
 * Nexus SDK Main Client
 */

import { HttpClient } from './http';
import { MemoryService } from './services/memory';
import { ConversationService } from './services/conversation';
import { ContextService } from './services/context';
import { KnowledgeService } from './services/knowledge';
import type { NexusClientConfig } from './types';

/**
 * Tenant information
 */
export interface TenantInfo {
  /** Tenant ID */
  tenant_id: string;

  /** Tenant name */
  name: string;

  /** Quota limit */
  quota_limit: number;

  /** Quota used */
  quota_used: number;

  /** Quota remaining */
  quota_remaining: number;

  /** Tenant status */
  status: string;
}

/**
 * Usage statistics
 */
export interface UsageStats {
  /** Total API calls in period */
  api_calls: number;

  /** Success rate */
  success_rate: number;

  /** Average latency in ms */
  avg_latency_ms: number;

  /** Period */
  period: 'day' | 'week' | 'month';
}

/**
 * Nexus SDK Client
 *
 * Main entry point for the SDK. Provides access to all services.
 *
 * @example
 * ```ts
 * import { NexusClient } from '@nexus/sdk';
 *
 * const client = new NexusClient({
 *   apiKey: 'nx_live_your_api_key_here',
 *   baseURL: 'https://api.nexus.10cg.pub/v1'
 * });
 *
 * // Access services
 * const memory = await client.memories.create({
 *   content: 'User prefers dark mode',
 *   user_id: 'user_123'
 * });
 *
 * const context = await client.context.retrieve({
 *   user_id: 'user_123',
 *   query: 'User preferences'
 * });
 * ```
 */
export class NexusClient {
  private readonly http: HttpClient;

  /**
   * Memory Service - Manages user memories and preferences
   */
  public readonly memories: MemoryService;

  /**
   * Conversation Service - Manages conversations and messages
   */
  public readonly conversations: ConversationService;

  /**
   * Context Service - Aggregates profile, history, and knowledge
   *
   * This is the main Chat flow API - retrieves all relevant context
   * in a single call.
   */
  public readonly context: ContextService;

  /**
   * Knowledge Service - Manages knowledge graph
   */
  public readonly knowledge: KnowledgeService;

  /**
   * Create a new Nexus client
   * @param config - Client configuration
   */
  constructor(config: NexusClientConfig) {
    this.http = new HttpClient(config);

    // Initialize services
    this.memories = new MemoryService(this.http);
    this.conversations = new ConversationService(this.http);
    this.context = new ContextService(this.http);
    this.knowledge = new KnowledgeService(this.http);
  }

  /**
   * Get tenant information
   * @returns Tenant info including quota usage
   * @example
   * ```ts
   * const tenant = await client.getTenant();
   * console.log(tenant.name);
   * console.log(tenant.quota_remaining);
   * ```
   */
  async getTenant(): Promise<TenantInfo> {
    return this.http.get<TenantInfo>('/tenant');
  }

  /**
   * Get usage statistics
   * @param period - Time period for stats
   * @returns Usage statistics
   * @example
   * ```ts
   * const stats = await client.getUsage('day');
   * console.log(stats.api_calls);
   * ```
   */
  async getUsage(
    period: 'day' | 'week' | 'month' = 'day',
  ): Promise<UsageStats> {
    return this.http.get<UsageStats>(`/tenant/usage?period=${period}`);
  }
}
