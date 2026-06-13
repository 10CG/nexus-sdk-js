/**
 * @nexusm/sdk - Conversation Types
 *
 * Type definitions for the Conversation Service.
 * Manages conversation history, messages, and auto-generated summaries.
 *
 * v4.0.0 BREAKING (memory-conversation-contract-reconciliation, 2026-06-11):
 * canonical = backend Pydantic response models (`schemas/conversation.py`)
 * serialized wire names. The previous shapes were drifted: nested
 * `{data, pagination}` containers never existed on the wire (backend lists
 * are FLAT), the conversation identifier wire key is `conversation_id` (the
 * old `session_id` was a phantom), `ConversationDetail` described a response
 * no endpoint emits, and `ConversationSummary` declared phantom
 * `key_points`/`generated_at` while missing the real count fields.
 */

// ============== Message Role ==============

/** Valid message roles in a conversation */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/** Conversation status */
export type ConversationStatus = 'active' | 'archived' | 'deleted';

// ============== Conversation ==============

/**
 * A conversation session between a user and an AI agent.
 *
 * GET /conversations/{conversation_id} — mirrors backend
 * `ConversationResponse` (11 fields, flat).
 *
 * v4.0.0 BREAKING: `session_id` → `conversation_id` (the real wire key —
 * backend field `compound_session_id` serializes via alias); adds
 * `tenant_id` / `agent_id` / `status` (previously missing).
 */
export interface Conversation {
  /** Unique conversation identifier (UUID) */
  id: string;
  /** Compound session ID ("tenant::user::session") — the wire key */
  conversation_id: string;
  /** Tenant identifier */
  tenant_id: string;
  /** User ID that owns this conversation */
  user_id: string;
  /**
   * Originating agent (null when not agent-created).
   *
   * v5.0.0: required-nullable convention — always emitted by the backend
   * (`ConversationResponse.agent_id: str | None`), value may be null. Was
   * `agent_id?: string | null` (optional); now `string | null` (required dict).
   */
  agent_id: string | null;
  /** Conversation status (e.g. active / archived) */
  status: string;
  /** Auto-generated conversation summary (null until first summary worker run) */
  summary: string | null;
  /** Total number of messages in the conversation */
  message_count: number;
  /** Additional metadata key-value pairs (always emitted, defaults to {}) */
  metadata: Record<string, unknown>;
  /** Timestamp when the conversation was created (ISO 8601) */
  created_at: string;
  /** Timestamp when the conversation was last updated (ISO 8601) */
  updated_at: string;
}

/**
 * Request payload for creating a new conversation.
 *
 * POST /conversations — mirrors backend `CreateConversationRequest`.
 *
 * v5.0.0 BREAKING: removed phantom `session_id` — the backend
 * (`CreateConversationRequest`) does not accept it; it was silently dropped
 * by Pydantic `extra=ignore`, and the session id is ALWAYS auto-generated
 * server-side regardless of input (the old "auto-generated if not provided"
 * doc was false). Added `agent_id` — the backend accepts it but the SDK had
 * no way to send it.
 */
export interface ConversationCreate {
  /** User ID to associate the conversation with */
  user_id: string;
  /** Optional agent identifier to associate the conversation with */
  agent_id?: string;
  /** Additional metadata key-value pairs */
  metadata?: Record<string, unknown>;
}

// v4.0.0 BREAKING: `ConversationDetail` was REMOVED — the backend
// GET /conversations/{id} response_model is ConversationResponse; no endpoint
// emits a conversation-with-messages shape (it was a phantom, together with
// the phantom `include_messages` query param). Fetch messages via
// `conversations.getMessages()`.

// ============== Message ==============

/**
 * A single message within a conversation.
 *
 * Mirrors backend `MessageResponse` (11 fields).
 *
 * v4.0.0 BREAKING: adds `message_id` / `conversation_id` /
 * `conversation_compound_id` / `tenant_id` / `user_id` correlation fields
 * (previously missing from the SDK type while present on the wire).
 */
export interface Message {
  /** Unique message identifier (UUID) */
  id: string;
  /** Compound message ID */
  message_id: string;
  /** Owning conversation UUID (NOT the compound id — see conversation_compound_id) */
  conversation_id: string;
  /** Owning conversation compound ID ("tenant::user::session") */
  conversation_compound_id: string;
  /** Tenant identifier */
  tenant_id: string;
  /** User identifier */
  user_id: string;
  /** Message role (user, assistant, system, or tool) */
  role: MessageRole;
  /** Message content text */
  content: string;
  /** Additional metadata key-value pairs */
  metadata?: Record<string, unknown>;
  /** Message sequence number within the conversation */
  sequence: number;
  /** Timestamp when the message was created (ISO 8601) */
  created_at: string;
}

/**
 * Request payload for adding a message to a conversation.
 *
 * POST /conversations/:conversation_id/messages
 */
export interface MessageCreate {
  /** Message role */
  role: MessageRole;
  /** Message content text (1-50000 characters) */
  content: string;
  /** Additional metadata key-value pairs */
  metadata?: Record<string, unknown>;
}

// ============== Conversation List ==============

/**
 * Paginated list of conversations.
 *
 * GET /conversations?user_id=... — mirrors backend
 * `ConversationListResponse` (FLAT container).
 *
 * v4.0.0 BREAKING: was nested `{data, pagination:{total, limit, offset,
 * has_more}}` — that shape never existed on the wire.
 */
export interface ConversationList {
  /** Array of conversation records */
  conversations: Conversation[];
  /** Total number of conversations */
  total_count: number;
  /** Current page size limit */
  limit: number;
  /** Current offset */
  offset: number;
  /** Whether more results exist */
  has_next: boolean;
}

/**
 * Paginated list of messages within a conversation.
 *
 * GET /conversations/:conversation_id/messages — mirrors backend
 * `MessageListResponse` (FLAT container).
 *
 * v4.0.0 BREAKING: was `{data, has_more}` — missing
 * total_count/limit/offset and using a phantom container key.
 */
export interface MessageList {
  /** Array of message records */
  messages: Message[];
  /** Total number of messages */
  total_count: number;
  /** Current page size limit */
  limit: number;
  /** Current offset */
  offset: number;
  /** Whether more messages exist */
  has_next: boolean;
}

// ============== Conversation Summary ==============

/**
 * Auto-generated summary of a conversation.
 *
 * GET /conversations/:conversation_id/summary — mirrors backend
 * `SummaryResponse` (5 fields).
 *
 * v4.0.0 BREAKING: the previous shape declared phantom `key_points[]` /
 * `generated_at`; the backend emits message counts + `created_at`. The wire
 * id key is `conversation_id` (unified 2026-06-11 — the endpoint previously
 * emitted `compound_session_id`, an internal third id variant).
 */
export interface ConversationSummary {
  /** Compound conversation ID (same key as Conversation.conversation_id) */
  conversation_id: string;
  /** Generated summary text (null until first summary) */
  summary?: string | null;
  /** Number of messages already folded into the summary */
  summary_message_count: number;
  /** Total number of messages in the conversation */
  message_count: number;
  /** Timestamp when the conversation was created (ISO 8601) */
  created_at: string;
}
