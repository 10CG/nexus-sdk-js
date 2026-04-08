/**
 * @module client
 * @description Main entry point for the Nexus SDK.
 *
 * The {@link NexusClient} class is the single object that SDK consumers
 * instantiate.  It resolves configuration, creates a shared HTTP transport,
 * and exposes every domain service as a readonly property.
 */

import { resolveConfig } from './config';
import type { NexusConfig } from './config';
import { HttpClient } from './http';
import { OfflineQueue } from './http/queue';
import { ContextService } from './services/context';
import { MemoryService } from './services/memories';
import { ConversationService } from './services/conversations';
import { KnowledgeService } from './services/knowledge';
import { ActivityService } from './services/activities';
import { TenantService } from './services/tenants';
import { FeedbackService } from './services/feedback';

/**
 * Nexus AI Cognitive Services SDK client.
 *
 * Create a single instance and use the service properties to interact
 * with the Nexus platform.
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({
 *   apiKey: process.env.NEXUS_API_KEY!,
 * });
 *
 * // Aggregated context retrieval (Chat main flow)
 * const ctx = await nexus.context.retrieve({
 *   user_id: 'user123',
 *   query: '用户偏好',
 * });
 *
 * // Memory search
 * const memories = await nexus.memories.search({
 *   user_id: 'user123',
 *   query: 'favourite colour',
 * });
 * ```
 */
export class NexusClient {
  /** Aggregated context retrieval (Chat main flow). */
  public readonly context: ContextService;

  /** Memory CRUD, search, and journal. */
  public readonly memories: MemoryService;

  /** Conversation lifecycle and messages. */
  public readonly conversations: ConversationService;

  /** Knowledge graph entities and queries. */
  public readonly knowledge: KnowledgeService;

  /** Activity stream ingestion for passive memory. */
  public readonly activities: ActivityService;

  /** Tenant profile and usage management. */
  public readonly tenants: TenantService;

  /** Feedback loop — submit ratings and query feedback records (v5.0). */
  public readonly feedback: FeedbackService;

  /** @internal Shared HTTP transport. */
  private readonly http: HttpClient;

  /**
   * Create a new Nexus SDK client.
   *
   * @param config - SDK configuration. Only `apiKey` is required; all other
   *   fields fall back to sensible defaults (see {@link resolveConfig}).
   *
   * @throws {Error} If `apiKey` is missing or empty.
   */
  constructor(config: NexusConfig) {
    const resolved = resolveConfig(config);
    this.http = new HttpClient(resolved);

    this.context = new ContextService(this.http);
    this.memories = new MemoryService(this.http);
    this.conversations = new ConversationService(this.http);
    this.knowledge = new KnowledgeService(this.http);
    this.activities = new ActivityService(this.http);
    this.tenants = new TenantService(this.http);
    this.feedback = new FeedbackService(this.http);
  }

  /**
   * Access the offline queue instance (if offline mode is enabled).
   */
  get queue(): OfflineQueue | undefined {
    return this.http.queue;
  }

  /**
   * Set the online/offline status of the client.
   *
   * When transitioning from offline to online, queued requests are
   * automatically flushed.
   */
  setOnline(online: boolean): void {
    this.http.setOnline(online);
  }
}
