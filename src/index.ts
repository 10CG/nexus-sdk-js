/**
 * @nexus/sdk - Nexus AI Cognitive Services SDK
 *
 * Unified entry point that re-exports the public API surface:
 * - {@link NexusClient} - Main client class (primary entry point)
 * - Service classes - For advanced / standalone usage
 * - Configuration helpers and types
 * - Error hierarchy
 * - Domain type definitions
 *
 * @example
 * ```typescript
 * import { NexusClient } from '@nexus/sdk';
 *
 * const nexus = new NexusClient({
 *   apiKey: process.env.NEXUS_API_KEY!,
 * });
 *
 * const ctx = await nexus.context.retrieve({
 *   user_id: 'user123',
 *   query: '用户偏好',
 * });
 * ```
 */

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------
export { NexusClient } from './client';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
export { resolveConfig, DEFAULT_CONFIG } from './config';
export type {
  NexusConfig,
  ResolvedConfig,
  CacheConfig,
  RetryConfig,
  ResolvedCacheConfig,
  ResolvedRetryConfig,
} from './config';

// ---------------------------------------------------------------------------
// Services (for advanced / standalone usage)
// ---------------------------------------------------------------------------
export { ContextService } from './services/context';
export { MemoryService } from './services/memories';
export { ConversationService } from './services/conversations';
export { KnowledgeService } from './services/knowledge';
export { ActivityService } from './services/activities';
export { TenantService } from './services/tenants';
export { FeedbackService } from './services/feedback';

// Service parameter types (defined in service files)
export type { MemoryListParams, MemoryJournalParams } from './services/memories';
export type { ConversationListParams, MessageListParams } from './services/conversations';
export type { EntityCreate, EntityListParams } from './services/knowledge';
export type { FeedbackListParams } from './services/feedback';
export type { RequestOptions } from './services/base';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
export {
  NexusError,
  ConfigurationError,
  NetworkError,
  TimeoutError,
} from './errors';
export {
  ApiError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  InputValidationError,
} from './errors';

// ---------------------------------------------------------------------------
// Types
//
// Note: The `ApiError` interface from `./types` is intentionally excluded
// to avoid a naming collision with the `ApiError` class from `./errors`.
// Consumers who need the raw API error *shape* can import `ApiErrorDetail`
// instead, or import `ApiError` directly from `@nexus/sdk/types`.
// ---------------------------------------------------------------------------

// Common types (excluding ApiError to avoid collision with errors/ApiError class)
export type {
  Pagination,
  PaginatedResponse,
  ApiResponse,
  ApiErrorDetail,
  HealthResponse,
  HealthStatus,
  ServiceStatus,
  CompoundId,
  SortOrder,
  OfflineConfig,
} from './types';

// Context types
export type {
  ContextLayer,
  ContextDepth,
  ContextDepthPreset,
  ContextRequest,
  ContextMemory,
  ContextProfile,
  ContextMessage,
  ContextHistory,
  ContextEntity,
  ContextRelation,
  ContextGraph,
  ContextMeta,
  ContextRetrieveResponse,
  OwnerType,
} from './types';
export { DEPTH_PRESETS } from './types';

// Memory types
export type {
  Memory,
  MemoryCreate,
  MemoryUpdate,
  MemorySearch,
  MemorySearchResult,
  MemoryList,
  JournalEntry,
  JournalResponse,
  MemoryType,
} from './types';

// Conversation types
export type {
  Conversation,
  ConversationCreate,
  ConversationDetail,
  ConversationList,
  Message,
  MessageCreate,
  MessageList,
  ConversationSummary,
  MessageRole,
  ConversationStatus,
} from './types';

// Knowledge types
export type {
  KnowledgeEntity,
  KnowledgeRelationship,
  ExtractionRequest,
  ExtractionResult,
  EntityListResponse,
  GraphQueryRequest,
  GraphPathEntity,
  GraphPathRelationship,
  GraphPath,
  GraphQueryResponse,
} from './types';

// Activity types
export type {
  Activity,
  ActivityStreamRequest,
  ActivityStreamResponse,
  ActivityStatusResponse,
  ActivityStats,
  ActivityType,
  ActivityProcessingStatus,
} from './types';

// Tenant types
export type {
  Tenant,
  TenantQuotas,
  TenantUsage,
  ApiKey,
  ApiKeyCreate,
  ApiKeyCreated,
  UsageStats,
  TenantTier,
  ApiKeyScope,
} from './types';

// Feedback types
export type {
  FeedbackItemRequest,
  FeedbackSubmitRequest,
  FeedbackResponse,
  FeedbackListItem,
  FeedbackListResponse,
} from './types';

// ---------------------------------------------------------------------------
// HTTP utilities
// ---------------------------------------------------------------------------
export { OfflineQueue } from './http';
export type { QueuedRequest } from './http';

// ---------------------------------------------------------------------------
// Zod Schemas (runtime validation)
// ---------------------------------------------------------------------------
export {
  contextRequestSchema,
  memoryCreateSchema,
  memoryUpdateSchema,
  memorySearchSchema,
  conversationCreateSchema,
  messageCreateSchema,
  entityCreateSchema,
  graphQueryRequestSchema,
  extractionRequestSchema,
  apiKeyCreateSchema,
} from './schemas';
