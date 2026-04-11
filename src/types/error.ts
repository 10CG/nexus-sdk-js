/**
 * @module types/error
 * @description Type definitions for the Error Reporting API (US-031).
 */

/** Error type classification. */
export type ErrorType =
  | 'api_error'
  | 'data_inconsistency'
  | 'performance'
  | 'other';

/** Severity level of the error. */
export type ErrorSeverity = 'critical' | 'major' | 'minor';

/** Request body for POST /v1/errors. */
export interface ErrorReportRequest {
  /** Type of error being reported. */
  error_type: ErrorType;
  /** Severity level of the error. */
  severity: ErrorSeverity;
  /** Detailed description of the error. */
  description: string;
  /** Optional: associated retrieve request ID. */
  retrieve_id?: string;
  /** SDK auto-collected request context. */
  request_context?: Record<string, unknown>;
  /** Steps to reproduce the error. */
  reproduction_steps?: string;
  /** Environment information (PII will be filtered server-side). */
  environment?: Record<string, unknown>;
}

/** Response from POST /v1/errors. */
export interface ErrorReportResponse {
  /** Error report ID. */
  id: string;
  /** Deduplication fingerprint. */
  fingerprint: string;
  /** Number of times this error has been reported. */
  occurrence_count: number;
  /** Whether this is a new error vs an existing one incremented. */
  is_new: boolean;
  /** When the error was first reported. */
  created_at: string;
}
