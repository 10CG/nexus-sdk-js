/**
 * @module http/queue
 * @description Offline request queue for the Nexus SDK.
 *
 * When the network is unavailable, requests can be enqueued and later
 * flushed (replayed) once connectivity is restored. Each enqueued request
 * returns a `Promise` so callers can `await` the eventual result
 * transparently.
 */

import { NexusError } from '../errors/base';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A request that has been queued for later execution.
 *
 * The `resolve` and `reject` callbacks are wired to the `Promise` returned
 * by {@link OfflineQueue.enqueue}, allowing the original caller to `await`
 * the result even though the actual HTTP call is deferred.
 */
export interface QueuedRequest {
  /** Unique identifier for this queued request. */
  id: string;
  /** HTTP method (e.g. `GET`, `POST`, `PUT`, `DELETE`). */
  method: string;
  /** URL path relative to the base URL. */
  path: string;
  /** Optional request body. */
  data?: unknown;
  /** Resolve the caller's deferred promise with the response. */
  resolve: (value: unknown) => void;
  /** Reject the caller's deferred promise with an error. */
  reject: (error: unknown) => void;
  /** Unix timestamp (ms) when the request was enqueued. */
  timestamp: number;
}

// ---------------------------------------------------------------------------
// OfflineQueue
// ---------------------------------------------------------------------------

/**
 * Queues HTTP requests while the client is offline and replays them
 * when connectivity is restored.
 *
 * Each call to {@link enqueue} returns a `Promise` that resolves (or
 * rejects) only after the request has been successfully flushed via
 * {@link flush}. This allows consuming code to `await` the result as
 * if the request were executed immediately.
 *
 * @example
 * ```typescript
 * const queue = new OfflineQueue(50);
 *
 * // While offline -- the promise won't settle until flush()
 * const pending = queue.enqueue({ method: 'POST', path: '/memory/add', data: { text: 'hello' } });
 *
 * // Later, when online again
 * await queue.flush(async (req) => httpClient.post(req.path, req.data));
 *
 * // Now `pending` has resolved with the server response
 * const result = await pending;
 * ```
 */
export class OfflineQueue {
  /** Internal FIFO queue of deferred requests. */
  private readonly queue: QueuedRequest[] = [];

  /** Maximum number of requests the queue will hold. */
  private readonly maxSize: number;

  /** Guard flag to prevent concurrent flush operations. */
  private processing = false;

  /** Auto-incrementing counter used to generate unique request IDs. */
  private idCounter = 0;

  /**
   * Create a new offline queue.
   *
   * @param maxSize - Maximum number of requests to buffer. When the queue
   *                  is full, subsequent {@link enqueue} calls will reject
   *                  immediately. Defaults to `100`.
   */
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Add a request to the queue.
   *
   * The returned `Promise` settles only when the request is eventually
   * executed during a {@link flush} call.
   *
   * @param request - The request descriptor (method, path, and optional data).
   * @returns A `Promise` that resolves with the executor's return value
   *          once the request is flushed, or rejects if the queue is full
   *          or the executor fails.
   *
   * @throws {NexusError} If the queue has reached its maximum capacity.
   */
  enqueue<T = unknown>(
    request: Omit<QueuedRequest, 'id' | 'resolve' | 'reject' | 'timestamp'>,
  ): Promise<T> {
    if (this.queue.length >= this.maxSize) {
      return Promise.reject(
        new NexusError(
          `Offline queue is full (max ${this.maxSize}). Request to ${request.method} ${request.path} was rejected.`,
          'NEXUS_QUEUE_FULL',
        ),
      );
    }

    return new Promise<T>((resolve, reject) => {
      this.idCounter += 1;

      const queued: QueuedRequest = {
        id: `oq_${this.idCounter}_${Date.now()}`,
        method: request.method,
        path: request.path,
        data: request.data,
        resolve: resolve as (value: unknown) => void,
        reject,
        timestamp: Date.now(),
      };

      this.queue.push(queued);
    });
  }

  /**
   * Process all queued requests in FIFO order.
   *
   * Each request is passed to the provided `executor` function. On success
   * the caller's deferred promise is resolved; on failure it is rejected.
   *
   * Requests are processed sequentially to preserve ordering guarantees.
   * If a flush is already in progress, subsequent calls are silently ignored.
   *
   * @param executor - An async function that performs the actual HTTP call
   *                   for a given queued request and returns the response.
   *
   * @example
   * ```typescript
   * await queue.flush(async (req) => {
   *   return httpClient.request(req.method, req.path, req.data);
   * });
   * ```
   */
  async flush(
    executor: (req: QueuedRequest) => Promise<unknown>,
  ): Promise<void> {
    // Prevent concurrent flushes
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        // Shift from the front to maintain FIFO order
        const request = this.queue.shift()!;

        try {
          const result = await executor(request);
          request.resolve(result);
        } catch (error: unknown) {
          request.reject(error);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * The number of requests currently waiting in the queue.
   */
  get size(): number {
    return this.queue.length;
  }

  /**
   * Remove all pending requests from the queue.
   *
   * Every deferred promise is rejected with a cancellation error so that
   * callers are not left hanging indefinitely.
   */
  clear(): void {
    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      request.reject(
        new NexusError(
          'Request cancelled: offline queue was cleared.',
          'NEXUS_QUEUE_CLEARED',
        ),
      );
    }
  }
}
