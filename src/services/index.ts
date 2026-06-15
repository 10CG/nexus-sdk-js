/**
 * @module services
 * @description Unified export of all Nexus SDK service classes.
 *
 * Each service wraps a domain of the Nexus API:
 * - {@link ContextService} - Aggregated context retrieval (Chat main flow)
 * - {@link MemoryService} - Long-term memory management (Mem0)
 * - {@link ConversationService} - Conversation history and auto-summary (Zep OSS)
 * - {@link KnowledgeService} - Knowledge graph construction and query (Fast GraphRAG)
 * - {@link ActivityService} - Activity stream ingestion for passive memory
 * - {@link TenantService} - Tenant profile and usage management
 * - {@link FeedbackService} - Feedback loop: submit ratings and query records (v5.0)
 * - {@link DashboardService} - Dashboard analytics export (US-033b FU-3)
 */

// Base
export { BaseService } from './base';

// Services
export { ContextService } from './context';
export { MemoryService } from './memories';
export type { MemoryListParams, MemoryJournalParams } from './memories';
export { ConversationService } from './conversations';
export type { ConversationListParams, MessageListParams } from './conversations';
export { KnowledgeService } from './knowledge';
export type { EntityListParams } from './knowledge';
export { ActivityService } from './activities';
export { TenantService } from './tenants';
export { FeedbackService } from './feedback';
export type { FeedbackListParams } from './feedback';
export { ErrorService } from './errors';
export { DashboardService } from './dashboard';
