/**
 * @module services/base
 * @description Abstract base class for all Nexus service modules.
 *
 * Every service (Context, Memory, Conversation, Knowledge) extends this
 * class to gain access to the shared {@link HttpClient} instance, which
 * handles authentication, error normalisation, and timeout management.
 */

import type { HttpClient } from '../http/client';

/**
 * Abstract base class that all Nexus service classes extend.
 *
 * Provides a protected reference to the SDK's {@link HttpClient} so that
 * subclasses can issue HTTP requests without managing connection details.
 *
 * @example
 * ```typescript
 * class MyService extends BaseService {
 *   async ping(): Promise<string> {
 *     return this.http.get<string>('/ping');
 *   }
 * }
 * ```
 */
export abstract class BaseService {
  /** Shared HTTP client instance configured with API key and tenant headers. */
  protected readonly http: HttpClient;

  /**
   * @param http - Fully-configured {@link HttpClient} instance.
   */
  constructor(http: HttpClient) {
    this.http = http;
  }
}
