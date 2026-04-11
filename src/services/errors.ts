/**
 * @module services/errors
 * @description Error Reporting Service — submit structured error reports.
 *
 * Wraps the Nexus Error Reporting API (US-031):
 * - POST /v1/errors — submit a structured error/bug report
 *
 * Errors are automatically deduplicated server-side by fingerprint
 * (SHA256 of error_type + endpoint + status_code).
 *
 * @example
 * ```typescript
 * const nexus = new NexusClient({ apiKey: 'nx_test_abc123' });
 *
 * // Manual error report
 * const report = await nexus.errors.submit({
 *   error_type: 'api_error',
 *   severity: 'major',
 *   description: 'Context retrieval returned empty despite known data',
 *   retrieve_id: 'uuid-from-retrieve-call',
 * });
 * ```
 */

import { BaseService } from './base';
import type { RequestOptions } from './base';
import type { ErrorReportRequest, ErrorReportResponse } from '../types/error';

/**
 * Service for submitting structured error reports.
 *
 * Reports are deduplicated server-side: repeated submissions with the
 * same fingerprint increment `occurrence_count` instead of creating
 * new records.
 */
export class ErrorService extends BaseService {
  /**
   * Submit a structured error report.
   *
   * @param data    - Error report payload.
   * @param options - Optional request options (e.g. AbortSignal).
   * @returns The created or updated error report metadata.
   */
  async submit(
    data: ErrorReportRequest,
    options?: RequestOptions,
  ): Promise<ErrorReportResponse> {
    return this.http.post<ErrorReportResponse>(
      '/errors',
      data,
      options?.signal,
    );
  }
}
