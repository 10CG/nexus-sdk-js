/**
 * @module errors/base
 * @description Base error classes for the Nexus SDK.
 */

/**
 * Base error class for all Nexus SDK errors.
 *
 * All SDK-specific errors extend this class, providing a consistent
 * `code` field for programmatic error handling.
 *
 * @example
 * ```typescript
 * try {
 *   await client.context.retrieve({ ... });
 * } catch (err) {
 *   if (err instanceof NexusError) {
 *     console.error(`[${err.code}] ${err.message}`);
 *   }
 * }
 * ```
 */
export class NexusError extends Error {
  /** Machine-readable error code (e.g. `NEXUS_API_ERROR`). */
  public readonly code: string;

  /** The original error that caused this error, if any. */
  public readonly cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    // Restore prototype chain — required when extending built-ins in TS
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'NexusError';
    this.code = code;
    this.cause = cause;
  }
}

/**
 * Thrown when the SDK is configured with invalid options.
 *
 * @example
 * ```typescript
 * // Missing required `apiKey`
 * new NexusClient({}) // throws ConfigurationError
 * ```
 */
export class ConfigurationError extends NexusError {
  constructor(message: string, cause?: Error) {
    super(message, 'NEXUS_CONFIGURATION_ERROR', cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * Thrown when a network-level failure occurs (timeout, DNS, connection refused, etc.).
 */
export class NetworkError extends NexusError {
  constructor(message: string, cause?: Error) {
    super(message, 'NEXUS_NETWORK_ERROR', cause);
    this.name = 'NetworkError';
  }
}

/**
 * Thrown when an operation exceeds its configured timeout.
 */
export class TimeoutError extends NexusError {
  constructor(message: string, cause?: Error) {
    super(message, 'NEXUS_TIMEOUT_ERROR', cause);
    this.name = 'TimeoutError';
  }
}
