/**
 * @module errors/api
 * @description API-level error classes mapped to HTTP status codes.
 */

import type { AxiosResponse } from 'axios';

import { NexusError } from './base';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shape of the standard Nexus API error response body. */
interface ApiErrorBody {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Extract a human-readable message from an API response body.
 */
function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const body = data as ApiErrorBody;
    return body.detail ?? body.message ?? fallback;
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

/**
 * Represents an error returned by the Nexus HTTP API.
 *
 * Use the static factory `ApiError.fromResponse()` to construct the most
 * specific subclass based on the HTTP status code.
 *
 * @example
 * ```typescript
 * try {
 *   await client.memory.search({ ... });
 * } catch (err) {
 *   if (err instanceof ApiError) {
 *     console.error(`HTTP ${err.statusCode}: ${err.message}`);
 *   }
 * }
 * ```
 */
export class ApiError extends NexusError {
  /** HTTP status code returned by the server. */
  public readonly statusCode: number;

  /** Raw response body, if available. */
  public readonly response?: unknown;

  constructor(
    message: string,
    statusCode: number,
    response?: unknown,
    code: string = 'NEXUS_API_ERROR',
  ) {
    super(message, code);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }

  /**
   * Create the most specific `ApiError` subclass from an Axios response.
   *
   * | Status | Error class            |
   * |--------|------------------------|
   * | 400    | `ValidationError`      |
   * | 401    | `AuthenticationError`  |
   * | 404    | `NotFoundError`        |
   * | 429    | `RateLimitError`       |
   * | other  | `ApiError`             |
   */
  static fromResponse(response: AxiosResponse): ApiError {
    const { status, data, headers } = response;

    switch (status) {
      case 400: {
        const msg = extractMessage(data, 'Validation failed');
        const details =
          data && typeof data === 'object'
            ? (data as ApiErrorBody).errors
            : undefined;
        return new ValidationError(msg, details, data);
      }

      case 401: {
        const msg = extractMessage(data, 'Authentication failed');
        return new AuthenticationError(msg, data);
      }

      case 404: {
        const msg = extractMessage(data, 'Resource not found');
        return new NotFoundError(msg, data);
      }

      case 429: {
        const msg = extractMessage(data, 'Rate limit exceeded');
        const retryAfter = headers?.['retry-after']
          ? Number(headers['retry-after'])
          : undefined;
        return new RateLimitError(msg, retryAfter, data);
      }

      default: {
        const msg = extractMessage(
          data,
          `API request failed with status ${status}`,
        );
        return new ApiError(msg, status, data);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Specific API errors
// ---------------------------------------------------------------------------

/**
 * HTTP 401 -- the request lacks valid authentication credentials.
 */
export class AuthenticationError extends ApiError {
  constructor(message: string, response?: unknown) {
    super(message, 401, response, 'NEXUS_AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * HTTP 429 -- the client has sent too many requests in a given time window.
 *
 * When the server provides a `Retry-After` header, it is exposed via
 * {@link RateLimitError.retryAfter} (in seconds).
 */
export class RateLimitError extends ApiError {
  /** Seconds to wait before retrying, parsed from the `Retry-After` header. */
  public readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number, response?: unknown) {
    super(message, 429, response, 'NEXUS_RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * HTTP 400 -- the request body or query parameters failed validation.
 *
 * When the server returns field-level errors they are available via
 * {@link ValidationError.details}.
 */
export class ValidationError extends ApiError {
  /** Per-field validation error messages, if provided by the server. */
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    details?: Record<string, string[]>,
    response?: unknown,
  ) {
    super(message, 400, response, 'NEXUS_VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

/**
 * HTTP 404 -- the requested resource does not exist.
 */
export class NotFoundError extends ApiError {
  constructor(message: string, response?: unknown) {
    super(message, 404, response, 'NEXUS_NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}
