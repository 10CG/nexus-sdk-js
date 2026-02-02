/**
 * HTTP client with fetch, retry, and timeout support
 */

import type { NexusClientConfig } from './types';
import {
  NexusError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  QuotaExceededError,
  NotFoundError,
  ServerError,
} from './errors';

/**
 * HTTP client for Nexus API
 */
export class HttpClient {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: NexusClientConfig) {
    this.baseURL = config.baseURL || 'https://api.nexus.10cg.pub/v1';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries ?? 3;
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a DELETE request
   */
  async delete(path: string): Promise<void> {
    const url = this.buildUrl(path);
    await this.request(url, { method: 'DELETE' });
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const baseUrl = this.baseURL.replace(/\/$/, '');
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(baseUrl + fullPath);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Make HTTP request with retry logic
   */
  private async request<T>(
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
    const headers = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...init.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.withTimeout(
          fetch(url, { ...init, headers }),
          this.timeout,
        );

        if (!response.ok) {
          const error = await this.parseError(response);

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw error;
          }

          // Retry server errors (5xx)
          if (response.status >= 500) {
            lastError = error;
            if (attempt < this.maxRetries) {
              await this.delay(Math.pow(2, attempt) * 1000);
              continue;
            }
            throw error;
          }
        }

        return await response.json();
      } catch (error) {
        if (error instanceof NexusError) {
          throw error;
        }

        lastError = error as Error;

        // Retry on network errors
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }

        throw new NetworkError(
          lastError.message || 'Network request failed',
          { url, attempts: attempt + 1 },
        );
      }
    }

    throw lastError || new NetworkError('Request failed');
  }

  /**
   * Wrap promise with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    ms: number,
  ): Promise<Response> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms);
    });

    return Promise.race([promise as Promise<Response>, timeoutPromise]);
  }

  /**
   * Delay for specified milliseconds
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse error response
   */
  private async parseError(response: Response): Promise<NexusError> {
    try {
      const data = await response.json();
      const error = data.error;

      switch (error.code) {
        case 'VALIDATION_ERROR':
          return new ValidationError(error.message, error.details);
        case 'AUTHENTICATION_ERROR':
          return new AuthenticationError(error.message);
        case 'QUOTA_EXCEEDED':
          return new QuotaExceededError(error.details);
        case 'NOT_FOUND':
          return new NotFoundError(error.message);
        case 'SERVER_ERROR':
        case 'INTERNAL_ERROR':
          return new ServerError(error.message, error.details);
        default:
          return new NexusError({
            status: response.status,
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || response.statusText,
            details: error.details,
          });
      }
    } catch {
      return new NexusError({
        status: response.status,
        code: 'UNKNOWN_ERROR',
        message: `HTTP ${response.status}: ${response.statusText}`,
      });
    }
  }
}
