/**
 * @module services/dashboard
 * @description Dashboard Service — export analytics datasets.
 *
 * Wraps the Nexus Dashboard API:
 * - GET /v1/dashboard/export — download a dataset as raw CSV or JSON text
 *
 * The export endpoint is a file-download endpoint: the backend responds with
 * `Content-Disposition: attachment` and a raw file body (not a JSON envelope).
 * Accordingly, `export()` returns the raw response string rather than parsing
 * it into an object — callers receive exactly the bytes the server sent.
 *
 * ### WebSocket realtime subscriptions — deferred
 *
 * US-033b FU-3 scope is limited to the REST export method.  A WebSocket
 * subscription helper (`subscribe()` / `DashboardSubscription`) was evaluated
 * for inclusion but is deferred to FU-4 (WS replay/catchup protocol decision).
 * Reasons:
 *   1. The WS message schema is not yet stabilised (FU-4 owns that contract).
 *   2. A proper WS abstraction requires a browser/Node `WebSocket` shim strategy
 *      that is a non-trivial independent surface.
 * Track the WS helper in FU-4; this file should be extended there.
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_test_abc123' });
 *
 * // Download quality distribution as CSV (default format)
 * const csv = await nexus.dashboard.export({ dataset: 'quality_distribution' });
 * // csv is a string like: "bucket,count\n0-1,12\n1-2,45\n..."
 *
 * // Download feedback trend as JSON
 * const json = await nexus.dashboard.export({
 *   dataset: 'feedback_trend',
 *   format: 'json',
 * });
 *
 * // Admin: export data scoped to a specific tenant
 * const tenantCsv = await nexus.dashboard.export({
 *   dataset: 'error_heatmap',
 *   format: 'csv',
 *   target_tenant_id: 'tenant-abc',
 * });
 * ```
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type { DashboardExportParams } from '../types/dashboard';

/**
 * Service for exporting dashboard analytics datasets.
 *
 * Exposes `GET /v1/dashboard/export` as a typed method that returns the raw
 * file body (CSV or JSON text) as a string.
 */
export class DashboardService extends BaseService {
  /**
   * Export a dashboard dataset as raw file content.
   *
   * Sends `GET /dashboard/export` with the given query parameters and returns
   * the raw response body as a string.  The string is exactly the file the
   * server would send for a browser download:
   * - `format: 'csv'` (default) → comma-separated text
   * - `format: 'json'`          → JSON text (not parsed into an object)
   *
   * @param params  - Dataset selection and format options.
   * @param options - Optional request options (e.g. AbortSignal).
   * @returns Raw file body string.
   *
   * @throws {ApiError} HTTP 401 — missing or invalid API key.
   * @throws {ApiError} HTTP 403 — `target_tenant_id` requires admin scope.
   * @throws {ApiError} HTTP 422 — `dataset` is not one of the six whitelisted values.
   */
  async export(
    params: DashboardExportParams,
    options?: RequestOptions,
  ): Promise<string> {
    const query: Record<string, unknown> = { dataset: params.dataset };
    if (params.format !== undefined) query['format'] = params.format;
    if (params.target_tenant_id !== undefined) {
      query['target_tenant_id'] = params.target_tenant_id;
    }

    return this.http.getText('/dashboard/export', query, options?.signal);
  }
}
