/**
 * @module services/feedback
 * @description Feedback Service — submit and query context-retrieval feedback.
 *
 * Wraps the Nexus Feedback Loop API (v5.0):
 * - PUT /v1/feedback/{retrieve_id}  — submit an explicit rating (L2 signal)
 * - GET /v1/feedback                — list feedback records for reporting
 *
 * The `retrieve_id` in each submission links back to a prior
 * `/context/retrieve` response, enabling the quality scoring pipeline to
 * correlate explicit feedback with L0 telemetry.
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_test_abc123' });
 *
 * // Submit feedback after a context retrieval
 * const result = await nexus.feedback.submit('retrieve-uuid', {
 *   rating: 4,
 *   item_feedback: [{ memory_id: 'mem-uuid', useful: true }],
 * });
 *
 * // List recent feedback
 * const list = await nexus.feedback.list({ user_id: 'user_42', limit: 20 });
 * ```
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type {
  FeedbackSubmitRequest,
  FeedbackResponse,
  FeedbackListResponse,
} from '../types/feedback';

/**
 * Query parameters for listing feedback records.
 */
export interface FeedbackListParams {
  /** Filter feedback records by user ID. */
  user_id?: string;
  /** Maximum number of records to return. */
  limit?: number;
  /** Zero-based offset for pagination. */
  offset?: number;
}

/**
 * Service for submitting and querying context-retrieval feedback.
 *
 * Exposes the Nexus Feedback Loop v5.0 endpoints. Feedback submissions
 * are processed asynchronously by the QualityScoreWorker and feed into
 * memory re-ranking.
 */
export class FeedbackService extends BaseService {
  /**
   * Submit explicit feedback for a prior context retrieval (L2 signal).
   *
   * The backend accepts the submission immediately (HTTP 202) and processes
   * quality scoring asynchronously via QualityScoreWorker.
   *
   * @param retrieveId - The `retrieve_id` returned by `/context/retrieve`.
   * @param data       - Rating and optional per-item feedback.
   * @param options    - Optional request options (e.g. AbortSignal).
   * @returns The created feedback record metadata.
   */
  async submit(
    retrieveId: string,
    data: FeedbackSubmitRequest,
    options?: RequestOptions,
  ): Promise<FeedbackResponse> {
    return this.http.put<FeedbackResponse>(
      `/feedback/${retrieveId}`,
      data,
      options?.signal,
    );
  }

  /**
   * List feedback records with optional filtering and pagination.
   *
   * @param params  - Optional filters: `user_id`, `limit`, `offset`.
   * @param options - Optional request options (e.g. AbortSignal).
   * @returns Paginated list of feedback records.
   */
  async list(
    params?: FeedbackListParams,
    options?: RequestOptions,
  ): Promise<FeedbackListResponse> {
    const query = new URLSearchParams();
    if (params?.user_id) query.set('user_id', params.user_id);
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString();
    return this.http.get<FeedbackListResponse>(
      `/feedback${qs ? `?${qs}` : ''}`,
      undefined,
      options?.signal,
    );
  }
}
