/**
 * @module services/activities
 * @description Activity stream service for passive memory ingestion.
 *
 * AI Agents report their actions (file edits, test runs, API calls, etc.)
 * through the activity stream. These activities are asynchronously converted
 * into semantic memories by the Nexus backend (Arq workers).
 *
 * @see {@link https://docs.nexus.10cg.pub/api/activities | Activity API Reference}
 */

import { BaseService } from './base';
import type {
  Activity,
  ActivityStreamRequest,
  ActivityStreamResponse,
} from '../types/activity';

/**
 * Service for ingesting activity streams from AI Agents.
 *
 * Activities are the primary mechanism for **passive memory** collection:
 * agents report what they do, and Nexus converts those actions into
 * searchable, contextual memories in the background.
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_live_...' });
 *
 * // Log a single activity
 * await nexus.activities.log({
 *   action: 'edit_file',
 *   activity_data: { path: 'src/index.ts', lines_changed: 42 },
 * });
 *
 * // Batch-ingest multiple activities
 * await nexus.activities.stream({
 *   agent_id: 'cursor-agent',
 *   activities: [
 *     { action: 'read_file', activity_data: { path: 'README.md' } },
 *     { action: 'edit_file', activity_data: { path: 'src/app.ts' } },
 *   ],
 * });
 * ```
 */
export class ActivityService extends BaseService {
  /**
   * Batch-ingest an activity stream.
   *
   * Accepts up to 1000 activities per request. Activities are queued for
   * asynchronous processing by Arq workers on the Nexus backend.
   *
   * @param request - The activity stream payload containing agent ID and activities.
   * @returns Processing summary with accepted / processed / queued counts.
   */
  async stream(request: ActivityStreamRequest): Promise<ActivityStreamResponse> {
    return this.http.post<ActivityStreamResponse>('/activities/stream', request);
  }

  /**
   * Convenience method to log a single activity.
   *
   * Wraps {@link stream} for the common case of reporting one event at a time.
   *
   * @param activity  - The activity event to record.
   * @param agentId   - Agent identifier (defaults to `'default'`).
   * @returns Processing summary with accepted / processed / queued counts.
   */
  async log(activity: Activity, agentId?: string): Promise<ActivityStreamResponse> {
    return this.stream({
      agent_id: agentId || 'default',
      activities: [activity],
    });
  }
}
