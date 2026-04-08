/**
 * @module types/feedback
 * @description Feedback Service type definitions.
 *
 * Mirrors the Nexus API v5.0 Feedback Loop schema:
 * - PUT /v1/feedback/{retrieve_id}  — submit rating + item-level feedback
 * - GET /v1/feedback                — list feedback records
 */

/**
 * Per-memory-item feedback within a single feedback submission.
 */
export interface FeedbackItemRequest {
  /** The memory that is being rated. */
  memory_id: string;
  /** Whether the memory item was useful in the retrieved context. */
  useful: boolean;
  /** Optional free-text explanation. */
  reason?: string;
}

/**
 * Request body for PUT /v1/feedback/{retrieve_id}.
 */
export interface FeedbackSubmitRequest {
  /** Overall quality rating for the context retrieval, 1 (poor) – 5 (excellent). */
  rating: number;
  /** Optional per-item ratings for individual memories in the response. */
  item_feedback?: FeedbackItemRequest[];
  /** Free-text description of expected information that was missing. */
  expected_missing?: string;
  /** Arbitrary caller-supplied context data stored alongside the feedback. */
  context?: Record<string, unknown>;
}

/**
 * Response from PUT /v1/feedback/{retrieve_id} (HTTP 202 Accepted).
 */
export interface FeedbackResponse {
  /** Unique identifier for the created feedback record. */
  feedback_id: string;
  /** The retrieve_id the feedback is associated with. */
  retrieve_id: string;
  /** Processing status — always "accepted" on success. */
  status: string;
  /** ISO 8601 timestamp of when the feedback was recorded. */
  created_at: string;
}

/**
 * A single feedback record returned by GET /v1/feedback.
 */
export interface FeedbackListItem {
  /** Unique identifier for this feedback record. */
  feedback_id: string;
  /** The retrieve_id the feedback is associated with. */
  retrieve_id: string;
  /** The user who submitted the feedback. */
  user_id: string;
  /** Overall quality rating (1–5), or null if not provided. */
  rating: number | null;
  /** Free-text description of expected missing information, if provided. */
  expected_missing: string | null;
  /** Diagnosis type assigned by the quality scoring pipeline, if any. */
  diagnosis_type: string | null;
  /** Caller-supplied context data stored with the feedback. */
  context_data: Record<string, unknown>;
  /** ISO 8601 timestamp of when the feedback was recorded. */
  created_at: string;
}

/**
 * Response from GET /v1/feedback (HTTP 200).
 */
export interface FeedbackListResponse {
  /** The feedback records for the requested page. */
  feedbacks: FeedbackListItem[];
  /** Total number of feedback records matching the query (for pagination). */
  total_count: number;
  /** Maximum number of records per page as applied by the backend. */
  limit: number;
  /** Zero-based offset of the first record in this page. */
  offset: number;
}
