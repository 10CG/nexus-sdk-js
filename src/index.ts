/**
 * Nexus SDK - Main entry point
 *
 * @example
 * ```ts
 * import { NexusClient } from '@nexus/sdk';
 *
 * const client = new NexusClient({
 *   apiKey: 'nx_live_your_api_key'
 * });
 * ```
 */

// Client
export { NexusClient, type TenantInfo, type UsageStats } from './client';

// HTTP client (for advanced usage)
export { HttpClient } from './http';

// Errors
export {
  NexusError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  QuotaExceededError,
  NotFoundError,
  ServerError,
} from './errors';

// Types
export type {
  // Common
  NexusClientConfig,
  PaginationOptions,
  PaginationMeta,
  // Memory
  Memory,
  MemoryCategory,
  CreateMemoryDto,
  SearchMemoryDto,
  UpdateMemoryDto,
  // Conversation
  Conversation,
  Message,
  MessageRole,
  CreateConversationDto,
  AddMessageDto,
  ConversationSummary,
  // Context
  ContextRetrieveOptions,
  ContextRetrieveDto,
  ContextRetrieveResponse,
  ContextProfile,
  ContextMemory,
  ContextHistory,
  ContextMessage,
  ContextGraph,
  ContextEntity,
  ContextRelation,
  // Knowledge
  OwnerType,
  KnowledgeExtractDto,
  KnowledgeExtractResult,
  Entity,
  Relationship,
  KnowledgeQueryDto,
  KnowledgeQueryResult,
} from './types';

// SDK version
export const SDK_VERSION = '0.1.0-alpha';
