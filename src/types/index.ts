/**
 * @nexusm/sdk - Type Definitions
 *
 * Unified export of all Nexus SDK TypeScript type definitions.
 * These types mirror the Nexus API v2.0 OpenAPI specification
 * and the Python Pydantic schemas.
 */

// Common types
export type {
  Pagination,
  PaginatedResponse,
  ApiResponse,
  ApiErrorDetail,
  ApiError,
  HealthResponse,
  HealthStatus,
  ServiceStatus,
  OfflineConfig,
} from './common';
export type { CompoundId, SortOrder } from './common';

// Configuration types (canonical source: ../config)
export type { CacheConfig, RetryConfig, NexusConfig } from '../config';

// Context types
export type {
  ContextLayer,
  ContextDepth,
  ContextDepthPreset,
  ContextRequest,
  ProfileMemory,
  ConversationMessage,
  ContextGraphEntity,
  ContextRetrieveResponse,
} from './context';
export { DEPTH_PRESETS } from './context';

// Memory types
export type {
  Memory,
  MemoryCreate,
  MemoryUpdate,
  MemorySearch,
  MemorySearchResult,
  SearchResult,
  MemoryList,
  JournalEntry,
  JournalResponse,
} from './memory';
export type { MemoryType } from './memory';

// Conversation types (v4.0.0: ConversationDetail removed — phantom shape)
export type {
  Conversation,
  ConversationCreate,
  ConversationList,
  Message,
  MessageCreate,
  MessageList,
  ConversationSummary,
} from './conversation';
export type { MessageRole, ConversationStatus } from './conversation';

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
} from './knowledge';

// Activity types
export type {
  Activity,
  ActivityStreamRequest,
  ActivityStreamResponse,
  ActivityStatusResponse,
  ActivityStats,
} from './activity';
export type { ActivityType, ActivityProcessingStatus } from './activity';

// Tenant types (v3.0.0: TenantUsage + ApiKeyScope removed — see types/tenant.ts)
export type {
  Tenant,
  TenantQuotas,
  ApiKey,
  ApiKeyCreate,
  ApiKeyCreated,
  UsageStats,
} from './tenant';
export type { TenantTier } from './tenant';

// Feedback types
export type {
  FeedbackItemRequest,
  FeedbackSubmitRequest,
  FeedbackResponse,
  FeedbackListItem,
  FeedbackListResponse,
} from './feedback';

// Error reporting types
export type {
  ErrorType,
  ErrorSeverity,
  ErrorReportRequest,
  ErrorReportResponse,
} from './error';

// Dashboard types
export type {
  DashboardExportDataset,
  DashboardExportParams,
} from './dashboard';
