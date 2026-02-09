/**
 * @module http/retry
 * @description Retry manager with exponential back-off and jitter.
 *
 * Wraps an async operation and transparently retries on transient failures
 * (network errors, timeouts, 429 rate-limits, 5xx server errors) using
 * configurable exponential back-off with ±10% jitter to prevent thundering
 * herd problems.
 */

import type { ResolvedRetryConfig } from '../config';
import { NetworkError, TimeoutError } from '../errors/base';
import { ApiError, RateLimitError } from '../errors/api';

/**
 * Manages retry logic for HTTP requests.
 *
 * When retries are disabled (`config === false`), {@link execute} delegates
 * directly to the provided function with zero overhead.
 *
 * @example
 * ```typescript
 * const retry = new RetryManager({ maxRetries: 3, initialDelay: 1000, maxDelay: 10000, backoffFactor: 2 });
 *
 * const result = await retry.execute(() => httpClient.get('/context/retrieve'));
 * ```
 */
export class RetryManager {
  /** Resolved retry configuration, or `false` when retries are disabled. */
  private readonly config: ResolvedRetryConfig | false;

  /**
   * Create a new retry manager.
   *
   * @param config - Fully-resolved retry settings, or `false` to disable retries entirely.
   */
  constructor(config: ResolvedRetryConfig | false) {
    this.config = config;
  }

  /**
   * Determine whether a given error is eligible for retry.
   *
   * Retryable conditions:
   * - {@link NetworkError} -- transient connectivity issues
   * - {@link TimeoutError} -- request exceeded its deadline
   * - {@link RateLimitError} (HTTP 429) -- server asks us to slow down
   * - Any {@link ApiError} with a 5xx status code -- server-side failures
   *
   * Non-retryable conditions:
   * - 4xx errors other than 429 (client errors that won't resolve on retry)
   * - Cancelled / aborted requests
   * - Any non-Nexus error (unknown failures are not assumed to be transient)
   *
   * @param error - The error to evaluate.
   * @returns `true` if the operation should be retried.
   */
  isRetryable(error: unknown): boolean {
    // Network-level failures are always transient
    if (error instanceof NetworkError) {
      return true;
    }

    // Timeouts are transient
    if (error instanceof TimeoutError) {
      return true;
    }

    // Rate-limit (429) -- the server explicitly expects us to retry later
    if (error instanceof RateLimitError) {
      return true;
    }

    // Other API errors: only 5xx (server errors) are retryable
    if (error instanceof ApiError) {
      return error.statusCode >= 500 && error.statusCode < 600;
    }

    // Cancelled requests and unknown errors are not retryable
    return false;
  }

  /**
   * Calculate the delay (in milliseconds) before the next retry attempt.
   *
   * Uses exponential back-off: `delay = initialDelay * backoffFactor ^ attempt`.
   *
   * Special cases:
   * - If the error is a {@link RateLimitError} with a `retryAfter` value,
   *   that value (converted to ms) takes precedence over the computed delay.
   * - A random jitter of ±10% is applied to prevent thundering herd.
   * - The result is clamped to {@link ResolvedRetryConfig.maxDelay}.
   *
   * @param attempt - Zero-based attempt index (0 = first retry).
   * @param error   - The error that triggered the retry (optional).
   * @returns Delay in milliseconds before the next attempt.
   */
  getDelay(attempt: number, error?: unknown): number {
    if (this.config === false) {
      return 0;
    }

    const { initialDelay, backoffFactor, maxDelay } = this.config;

    // If the server told us exactly when to retry, honour that
    if (error instanceof RateLimitError && error.retryAfter != null) {
      // retryAfter is in seconds; convert to ms and apply jitter
      const serverDelay = error.retryAfter * 1000;
      return Math.min(this.applyJitter(serverDelay), maxDelay);
    }

    // Exponential back-off: initialDelay * backoffFactor ^ attempt
    const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt);

    // Apply jitter and clamp
    return Math.min(this.applyJitter(exponentialDelay), maxDelay);
  }

  /**
   * Execute an async function with automatic retries on transient failures.
   *
   * If retries are disabled (`config === false`), the function is invoked
   * exactly once with no retry logic.
   *
   * @typeParam T - Return type of the wrapped function.
   * @param fn - The async operation to execute (and potentially retry).
   * @returns The resolved value of `fn`.
   * @throws The last error encountered if all retry attempts are exhausted,
   *         or immediately if the error is not retryable.
   *
   * @example
   * ```typescript
   * const manager = new RetryManager({ maxRetries: 3, initialDelay: 500, maxDelay: 5000, backoffFactor: 2 });
   *
   * const data = await manager.execute(async () => {
   *   return fetch('/api/data').then(r => r.json());
   * });
   * ```
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Retries disabled -- single attempt, no overhead
    if (this.config === false) {
      return fn();
    }

    const { maxRetries } = this.config;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: unknown) {
        lastError = error;

        // If the error is not retryable, fail immediately
        if (!this.isRetryable(error)) {
          throw error;
        }

        // If we've exhausted all retries, throw the last error
        if (attempt >= maxRetries) {
          throw error;
        }

        // Wait before the next attempt
        const delay = this.getDelay(attempt, error);
        await this.sleep(delay);
      }
    }

    // TypeScript: this line is technically unreachable, but satisfies the compiler
    throw lastError;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Apply ±10% random jitter to a delay value.
   *
   * @param delay - Base delay in milliseconds.
   * @returns Jittered delay in milliseconds.
   */
  private applyJitter(delay: number): number {
    // jitterFactor is in the range [0.9, 1.1]
    const jitterFactor = 0.9 + Math.random() * 0.2;
    return Math.round(delay * jitterFactor);
  }

  /**
   * Sleep for the specified duration.
   *
   * @param ms - Duration in milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
