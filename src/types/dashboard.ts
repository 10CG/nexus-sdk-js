/**
 * @module types/dashboard
 * @description Dashboard Service type definitions.
 *
 * Mirrors the Nexus API dashboard export contract:
 * - GET /v1/dashboard/export — download a dataset as CSV or JSON
 *
 * The export endpoint returns raw file content (text/csv or application/json),
 * not a JSON-parsed object.  The SDK therefore exposes these types only for
 * the _request_ side; the return value is `string`.
 */

/**
 * The set of exportable dashboard datasets.
 *
 * Must stay in sync with the backend `DashboardExportDataset` Literal:
 * - `quality_distribution` — Quality score bucket distribution
 * - `feedback_trend`       — Feedback rating trend over time
 * - `diagnosis_stats`      — Diagnosis type statistics
 * - `feedback_health`      — Overall feedback health metrics
 * - `error_heatmap`        — Error frequency heatmap by endpoint / time
 * - `ab_distribution`      — A/B experiment assignment distribution
 */
export type DashboardExportDataset =
  | 'quality_distribution'
  | 'feedback_trend'
  | 'diagnosis_stats'
  | 'feedback_health'
  | 'error_heatmap'
  | 'ab_distribution';

/**
 * Query parameters for `GET /v1/dashboard/export`.
 */
export interface DashboardExportParams {
  /**
   * The dataset to export.  Required.
   *
   * Must be one of the six whitelisted values ({@link DashboardExportDataset}).
   * The backend returns HTTP 422 for unknown values.
   */
  dataset: DashboardExportDataset;

  /**
   * File format for the exported data.
   *
   * - `'csv'`  — Comma-separated values (default when omitted).
   * - `'json'` — Raw JSON text (not parsed; returned as a string by the SDK).
   *
   * @default 'csv'
   */
  format?: 'csv' | 'json';

  /**
   * Filter results to a specific tenant.
   *
   * Only usable by API keys that carry the admin scope.  The backend returns
   * HTTP 403 when this field is present but the caller lacks admin privileges,
   * and HTTP 400 when the value is not a valid UUID (it is normalized to
   * canonical form server-side).
   */
  target_tenant_id?: string;
}
