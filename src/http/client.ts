/**
 * @module http/client
 * @description Low-level HTTP client for the Nexus SDK.
 *
 * Wraps an Axios instance with automatic authentication headers,
 * request/response interceptors, and error normalisation so that
 * every failure surfaces as a typed {@link NexusError} subclass.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from 'axios';

import type { ResolvedConfig } from '../config';
import type { OfflineConfig } from '../types/common';
import { NetworkError, TimeoutError } from '../errors/base';
import { ApiError } from '../errors/api';
import { CacheManager, isCacheablePost } from './cache';
import { RetryManager } from './retry';
import { OfflineQueue } from './queue';

/**
 * HTTP client that communicates with the Nexus API.
 *
 * All service-level modules (Memory, Conversation, Knowledge, Context)
 * delegate their network calls to a shared `HttpClient` instance, which
 * guarantees consistent authentication, timeout handling, and error
 * mapping across the entire SDK surface.
 *
 * @example
 * ```typescript
 * import { resolveConfig } from '../config';
 * import { HttpClient } from './client';
 *
 * const config = resolveConfig({ apiKey: 'nx_test_abc123' });
 * const http = new HttpClient(config);
 *
 * const memories = await http.get<Memory[]>('/memory/search', { query: 'hello' });
 * ```
 */
export class HttpClient {
  /** Underlying Axios instance. */
  private readonly axios: AxiosInstance;

  /** Fully-resolved SDK configuration snapshot. */
  private readonly config: ResolvedConfig;

  /** LRU cache for read requests. */
  private readonly cache: CacheManager;

  /** Retry manager for transient failures. */
  private readonly retry: RetryManager;

  /** Offline request queue (only created when offline config is provided). */
  private readonly offlineQueue?: OfflineQueue;

  /** Whether the client is currently considered online. */
  private _isOnline: boolean = true;

  /**
   * Optional callback to auto-report API errors to POST /v1/errors.
   * Set by NexusClient after ErrorService is initialized.
   * @internal
   */
  public onApiError?: (
    statusCode: number,
    method: string,
    url: string,
    detail: string,
  ) => void;

  /**
   * Create a new HTTP client.
   *
   * @param config - Fully-resolved SDK configuration (see {@link resolveConfig}).
   */
  constructor(config: ResolvedConfig) {
    this.config = config;
    this.cache = new CacheManager(config.cache);
    this.retry = new RetryManager(config.retry);

    if (config.offline?.enabled) {
      this.offlineQueue = new OfflineQueue(config.offline.maxQueueSize ?? 100);
    }

    this.axios = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  // -----------------------------------------------------------------------
  // Offline queue support
  // -----------------------------------------------------------------------

  /**
   * Set the online/offline status of the client.
   *
   * When transitioning from offline to online, the queued requests are
   * automatically flushed.
   *
   * @param online - `true` if the client is online, `false` if offline.
   */
  setOnline(online: boolean): void {
    const wasOffline = !this._isOnline;
    this._isOnline = online;

    if (wasOffline && online && this.offlineQueue) {
      void this.offlineQueue.flush(async (req) => {
        switch (req.method) {
          case 'POST':
            return this.post(req.path, req.data);
          case 'PUT':
            return this.put(req.path, req.data);
          case 'PATCH':
            return this.patch(req.path, req.data);
          case 'DELETE':
            return this.delete(req.path);
          default:
            return this.get(req.path);
        }
      });
    }
  }

  /**
   * Access the offline queue instance (if offline mode is enabled).
   */
  get queue(): OfflineQueue | undefined {
    return this.offlineQueue;
  }

  // -----------------------------------------------------------------------
  // Public request methods
  // -----------------------------------------------------------------------

  /**
   * Send a GET request.
   *
   * @typeParam T - Expected shape of the response body.
   * @param path   - URL path relative to the base URL (e.g. `/memory/search`).
   * @param params - Optional query parameters.
   * @param signal - Optional {@link AbortSignal} to cancel the request.
   * @returns The parsed response body.
   */
  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<T> {
    const cacheKey = this.cache.generateKey('GET', path, params);
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== undefined) return cached;

    const result = await this.retry.execute(async () => {
      const response = await this.axios.get<T>(path, { params, signal });
      return response.data;
    });
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Send a POST request.
   *
   * @typeParam T - Expected shape of the response body.
   * @param path   - URL path relative to the base URL.
   * @param data   - Optional request body.
   * @param signal - Optional {@link AbortSignal} to cancel the request.
   * @returns The parsed response body.
   */
  async post<T>(
    path: string,
    data?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    // Offline queue: enqueue write requests when offline
    if (this.offlineQueue && !this._isOnline) {
      return this.offlineQueue.enqueue<T>({ method: 'POST', path, data });
    }

    // Cacheable POST endpoints (read-only semantics)
    if (isCacheablePost(path)) {
      const cacheKey = this.cache.generateKey('POST', path, data);
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) return cached;

      const result = await this.retry.execute(async () => {
        const response = await this.axios.post<T>(path, data, { signal });
        return response.data;
      });
      this.cache.set(cacheKey, result);
      return result;
    }

    // Write POST: execute + invalidate related cache
    const result = await this.retry.execute(async () => {
      const response = await this.axios.post<T>(path, data, { signal });
      return response.data;
    });
    this.cache.invalidate(path.split('/').filter(Boolean)[0] ?? path);
    return result;
  }

  /**
   * Send a PUT request.
   *
   * @typeParam T - Expected shape of the response body.
   * @param path   - URL path relative to the base URL.
   * @param data   - Optional request body.
   * @param signal - Optional {@link AbortSignal} to cancel the request.
   * @returns The parsed response body.
   */
  async put<T>(
    path: string,
    data?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    if (this.offlineQueue && !this._isOnline) {
      return this.offlineQueue.enqueue<T>({ method: 'PUT', path, data });
    }

    const result = await this.retry.execute(async () => {
      const response = await this.axios.put<T>(path, data, { signal });
      return response.data;
    });
    this.cache.invalidate(path.split('/').filter(Boolean)[0] ?? path);
    return result;
  }

  /**
   * Send a PATCH request.
   *
   * @typeParam T - Expected shape of the response body.
   * @param path   - URL path relative to the base URL.
   * @param data   - Optional request body.
   * @param signal - Optional {@link AbortSignal} to cancel the request.
   * @returns The parsed response body.
   */
  async patch<T>(
    path: string,
    data?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    if (this.offlineQueue && !this._isOnline) {
      return this.offlineQueue.enqueue<T>({ method: 'PATCH', path, data });
    }

    const result = await this.retry.execute(async () => {
      const response = await this.axios.patch<T>(path, data, { signal });
      return response.data;
    });
    this.cache.invalidate(path.split('/').filter(Boolean)[0] ?? path);
    return result;
  }

  /**
   * Send a DELETE request.
   *
   * @typeParam T - Expected shape of the response body.
   * @param path   - URL path relative to the base URL.
   * @param signal - Optional {@link AbortSignal} to cancel the request.
   * @returns The parsed response body.
   */
  async delete<T>(path: string, signal?: AbortSignal): Promise<T> {
    if (this.offlineQueue && !this._isOnline) {
      return this.offlineQueue.enqueue<T>({ method: 'DELETE', path });
    }

    const result = await this.retry.execute(async () => {
      const response = await this.axios.delete<T>(path, { signal });
      return response.data;
    });
    this.cache.invalidate(path.split('/').filter(Boolean)[0] ?? path);
    return result;
  }

  // -----------------------------------------------------------------------
  // Interceptors
  // -----------------------------------------------------------------------

  /**
   * Attach the request interceptor.
   *
   * Responsibilities:
   * - Set `X-API-Key` authentication header.
   * - Set `X-Tenant-ID` header when a tenant identifier is configured.
   * - Ensure `Content-Type` is `application/json`.
   */
  private setupRequestInterceptor(): void {
    this.axios.interceptors.request.use((requestConfig) => {
      // Authentication
      requestConfig.headers.set('X-API-Key', this.config.apiKey);

      // Multi-tenant isolation
      if (this.config.tenantId) {
        requestConfig.headers.set('X-Tenant-ID', this.config.tenantId);
      }

      // Content negotiation
      requestConfig.headers.set('Content-Type', 'application/json');

      return requestConfig;
    });
  }

  /**
   * Attach the response interceptor.
   *
   * Successful responses pass through unchanged. Errors are normalised
   * into the appropriate {@link NexusError} subclass:
   *
   * | Condition              | Error class        |
   * |------------------------|--------------------|
   * | Request cancelled      | *(re-thrown as-is)*|
   * | Timeout (`ECONNABORTED`, `ETIMEDOUT`) | {@link TimeoutError}  |
   * | No response received   | {@link NetworkError}  |
   * | HTTP 4xx / 5xx         | {@link ApiError} (or subclass) |
   */
  private setupResponseInterceptor(): void {
    this.axios.interceptors.response.use(
      // Success handler -- pass through
      (response) => response,

      // Error handler -- normalise into NexusError hierarchy
      (error: AxiosError) => {
        // 1. Cancelled requests: re-throw without wrapping so callers
        //    can detect cancellation via `axios.isCancel()`.
        if (axios.isCancel(error)) {
          return Promise.reject(error);
        }

        // 2. Timeout errors (ECONNABORTED is used by axios for timeouts,
        //    ETIMEDOUT may come from the underlying socket).
        if (
          error.code === 'ECONNABORTED' ||
          error.code === 'ETIMEDOUT'
        ) {
          return Promise.reject(
            new TimeoutError(
              `Request to ${error.config?.url ?? 'unknown'} timed out after ${this.config.timeout}ms`,
              error,
            ),
          );
        }

        // 3. Server responded with an error status code.
        if (error.response) {
          const apiError = ApiError.fromResponse(error.response);

          // Auto-report to POST /v1/errors (fire-and-forget).
          // Skip reporting errors from the /errors endpoint itself to
          // avoid infinite loops.
          const reqUrl = error.config?.url ?? '';
          if (this.onApiError && !reqUrl.includes('/errors')) {
            try {
              this.onApiError(
                error.response.status,
                error.config?.method?.toUpperCase() ?? 'UNKNOWN',
                reqUrl,
                apiError.message,
              );
            } catch {
              // Never let auto-report failure break the main flow.
            }
          }

          return Promise.reject(apiError);
        }

        // 4. No response at all -- network-level failure
        //    (DNS resolution, connection refused, etc.)
        return Promise.reject(
          new NetworkError(
            error.message || 'A network error occurred',
            error,
          ),
        );
      },
    );
  }
}
