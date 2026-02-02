/**
 * Type exports
 */

// Common
export type {
  NexusClientConfig,
  PaginationOptions,
  PaginationMeta,
} from './common';

// Memory
export type {
  Memory,
  MemoryCategory,
  CreateMemoryDto,
  SearchMemoryDto,
  UpdateMemoryDto,
} from './memory';

// Conversation
export type {
  Conversation,
  Message,
  MessageRole,
  CreateConversationDto,
  AddMessageDto,
  ConversationSummary,
} from './conversation';

// Context
export type {
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
} from './context';

// Knowledge
export type {
  OwnerType,
  KnowledgeExtractDto,
  KnowledgeExtractResult,
  Entity,
  Relationship,
  KnowledgeQueryDto,
  KnowledgeQueryResult,
} from './knowledge';
