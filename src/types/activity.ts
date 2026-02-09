/**
 * @nexus/sdk - Activity Types
 *
 * Type definitions for the Activity Service (US-013 DX Enhancement).
 * Supports passive activity stream ingestion from AI Agents,
 * which are asynchronously converted into semantic memories.
 *
 * Based on Nexus API v2.0 OpenAPI specification.
 */

// ============== Activity Type ==============

/**
 * Supported activity action types for the activity stream.
 * AI Agents report these actions to build passive memory.
 */
export type ActivityType =
  | 'edit_file'
  | 'run_test'
  | 'api_call'
  | 'user_message'
  | 'agent_action'
  | 'read_file'
  | 'delete_file'
  | 'create_file'
  | 'commit'
  | 'command_run'
  | 'other';

// ============== Activity Item ==============

/**
 * A single activity event reported by an AI Agent.
 */
export interface Activity {
  /** Activity action type */
  action: ActivityType;
  /** Timestamp when the activity occurred (ISO 8601) */
  timestamp?: string;
  /** Optional session identifier for activity grouping */
  session_id?: string;
  /** Additional activity context (file path, test name, etc.) */
  activity_data?: Record<string, unknown>;
}

// ============== Activity Stream ==============

/**
 * Request payload for batch activity stream ingestion.
 * Accepts up to 1000 activities per request.
 *
 * POST /activities/stream
 */
export interface ActivityStreamRequest {
  /** Agent identifier reporting the activities */
  agent_id: string;
  /** Batch of activity events (1-1000 items) */
  activities: Activity[];
}

/**
 * Response from activity stream ingestion.
 */
export interface ActivityStreamResponse {
  /** Number of activities accepted for processing */
  accepted: number;
  /** Number of activities immediately processed */
  processed: number;
  /** Number of activities queued for background processing */
  queued: number;
  /** Request ID for tracking processing status */
  request_id: string;
}

// ============== Activity Status ==============

/** Processing status of a batch activity request */
export type ActivityProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Status of a previously submitted activity stream request.
 *
 * GET /activities/status/:request_id
 */
export interface ActivityStatusResponse {
  /** Request ID from the original stream submission */
  request_id: string;
  /** Current processing status */
  status: ActivityProcessingStatus;
  /** Number of activities accepted */
  accepted: number;
  /** Number of activities processed so far */
  processed: number;
  /** Number of activities still queued */
  queued: number;
}

// ============== Activity Stats ==============

/**
 * Activity statistics for the current tenant.
 *
 * GET /activities/stats
 */
export interface ActivityStats {
  /** Tenant identifier */
  tenant_id: string;
  /** Total number of activities ingested */
  total_activities: number;
  /** Number of activities that have been processed */
  processed_activities: number;
  /** Number of activities pending processing */
  pending_activities: number;
  /** Number of activities in the last 24 hours */
  recent_activities_24h: number;
}
