/**
 * Error classes for Nexus SDK
 */

/**
 * Base error options
 */
export interface NexusErrorOptions {
  /** HTTP status code */
  status: number;

  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Additional error details */
  details?: unknown;
}

/**
 * Base Nexus error class
 */
export class NexusError extends Error {
  /** HTTP status code */
  public readonly status: number;

  /** Error code */
  public readonly code: string;

  /** Additional error details */
  public readonly details?: unknown;

  constructor(options: NexusErrorOptions) {
    super(options.message);
    this.name = 'NexusError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Network error - request failed due to network issues
 */
export class NetworkError extends NexusError {
  constructor(message: string, details?: unknown) {
    super({
      status: 0,
      code: 'NETWORK_ERROR',
      message,
      details,
    });
    this.name = 'NetworkError';
  }
}

/**
 * Validation error - request validation failed
 */
export class ValidationError extends NexusError {
  constructor(message: string, details?: unknown) {
    super({
      status: 400,
      code: 'VALIDATION_ERROR',
      message,
      details,
    });
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error - invalid or missing API key
 */
export class AuthenticationError extends NexusError {
  constructor(message: string = 'Authentication failed') {
    super({
      status: 401,
      code: 'AUTHENTICATION_ERROR',
      message,
    });
    this.name = 'AuthenticationError';
  }
}

/**
 * Quota exceeded error - API quota limit reached
 */
export class QuotaExceededError extends NexusError {
  constructor(details?: { limit: number; used: number; retry_after?: number }) {
    super({
      status: 429,
      code: 'QUOTA_EXCEEDED',
      message: 'API quota exceeded',
      details,
    });
    this.name = 'QuotaExceededError';
  }
}

/**
 * Not found error - resource not found
 */
export class NotFoundError extends NexusError {
  constructor(message: string = 'Resource not found') {
    super({
      status: 404,
      code: 'NOT_FOUND',
      message,
    });
    this.name = 'NotFoundError';
  }
}

/**
 * Server error - internal server error (5xx)
 */
export class ServerError extends NexusError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super({
      status: 500,
      code: 'SERVER_ERROR',
      message,
      details,
    });
    this.name = 'ServerError';
  }
}
