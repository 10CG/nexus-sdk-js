/**
 * @module http
 * @description HTTP transport layer for the Nexus SDK.
 *
 * Re-exports the {@link HttpClient} for API communication,
 * {@link RetryManager} for automatic retry with exponential back-off,
 * and {@link OfflineQueue} for deferred request execution.
 */

export { HttpClient } from './client';
export { RetryManager } from './retry';
export { OfflineQueue } from './queue';
export type { QueuedRequest } from './queue';
