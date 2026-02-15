/**
 * @module config
 * @description Configuration management for the Nexus SDK.
 *
 * Provides sensible defaults, deep-merges user overrides, and exposes a
 * fully-resolved configuration object where every field is guaranteed to
 * be present.
 */

import type { OfflineConfig } from './types/common';

// ---------------------------------------------------------------------------
// Public configuration interfaces
// ---------------------------------------------------------------------------

/** Cache layer configuration. */
export interface CacheConfig {
  /** Maximum number of entries in the LRU cache. */
  max?: number;
  /** Time-to-live for cached entries, in **seconds**. */
  ttl?: number;
}

/** Automatic retry configuration with exponential back-off. */
export interface RetryConfig {
  /** Maximum number of retry attempts (excluding the initial request). */
  maxRetries?: number;
  /** Delay before the first retry, in **milliseconds**. */
  initialDelay?: number;
  /** Upper bound for the retry delay, in **milliseconds**. */
  maxDelay?: number;
  /** Multiplier applied to the delay after each attempt. */
  backoffFactor?: number;
}

/**
 * User-facing SDK configuration.
 *
 * Only `apiKey` is strictly required; every other field falls back to a
 * sensible default (see {@link DEFAULT_CONFIG}).
 */
export interface NexusConfig {
  /** API key used for authentication. */
  apiKey: string;
  /**
   * Tenant identifier for multi-tenant isolation.
   * When provided, it is sent as the `X-Tenant-ID` header on every request.
   */
  tenantId?: string;
  /** Base URL of the Nexus API (without trailing slash). */
  baseUrl?: string;
  /** Request timeout in **milliseconds**. */
  timeout?: number;
  /** LRU cache settings. Pass `false` to disable caching entirely. */
  cache?: CacheConfig | false;
  /** Retry behaviour. Pass `false` to disable retries entirely. */
  retry?: RetryConfig | false;
  /** Offline queue configuration. */
  offline?: OfflineConfig;
}

/** Fully-resolved cache configuration (all fields required). */
export interface ResolvedCacheConfig {
  /** Maximum number of entries in the LRU cache. */
  max: number;
  /** Time-to-live for cached entries, in **seconds**. */
  ttl: number;
}

/** Fully-resolved retry configuration (all fields required). */
export interface ResolvedRetryConfig {
  /** Maximum number of retry attempts. */
  maxRetries: number;
  /** Delay before the first retry, in **milliseconds**. */
  initialDelay: number;
  /** Upper bound for the retry delay, in **milliseconds**. */
  maxDelay: number;
  /** Multiplier applied to the delay after each attempt. */
  backoffFactor: number;
}

/**
 * Fully-resolved SDK configuration.
 *
 * Every field is guaranteed to be present after calling
 * {@link resolveConfig}.
 */
export interface ResolvedConfig {
  /** API key used for authentication. */
  apiKey: string;
  /** Tenant identifier (may be `undefined` if not provided). */
  tenantId?: string;
  /** Base URL of the Nexus API (without trailing slash). */
  baseUrl: string;
  /** Request timeout in **milliseconds**. */
  timeout: number;
  /** Resolved cache settings, or `false` if caching is disabled. */
  cache: ResolvedCacheConfig | false;
  /** Resolved retry settings, or `false` if retries are disabled. */
  retry: ResolvedRetryConfig | false;
  /** Offline queue configuration (undefined if not provided). */
  offline?: OfflineConfig;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** @internal Default cache configuration. */
const DEFAULT_CACHE: ResolvedCacheConfig = {
  max: 1000,
  ttl: 300, // 5 minutes
};

/** @internal Default retry configuration. */
const DEFAULT_RETRY: ResolvedRetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10_000,
  backoffFactor: 2,
};

/**
 * Default SDK configuration values.
 *
 * These are used as the base when merging user-provided overrides.
 */
export const DEFAULT_CONFIG = {
  baseUrl: 'http://localhost:8001/v1',
  timeout: 30_000, // 30 seconds
  cache: DEFAULT_CACHE,
  retry: DEFAULT_RETRY,
} as const;

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Deep-merge user configuration with defaults and return a fully-resolved
 * configuration object.
 *
 * @param userConfig - Partial configuration provided by the SDK consumer.
 * @returns A {@link ResolvedConfig} with every field populated.
 *
 * @throws {Error} If `apiKey` is missing or empty.
 *
 * @example
 * ```typescript
 * const resolved = resolveConfig({
 *   apiKey: 'sk-...',
 *   timeout: 5000,
 *   retry: { maxRetries: 5 },
 * });
 *
 * resolved.timeout;            // 5000
 * resolved.retry.maxRetries;   // 5
 * resolved.retry.initialDelay; // 1000 (default)
 * ```
 */
export function resolveConfig(userConfig: NexusConfig): ResolvedConfig {
  if (!userConfig.apiKey) {
    throw new Error(
      'NexusConfig: "apiKey" is required and must be a non-empty string.',
    );
  }

  // -- Cache: honour explicit `false` to disable --
  let cache: ResolvedCacheConfig | false;
  if (userConfig.cache === false) {
    cache = false;
  } else if (userConfig.cache) {
    cache = { ...DEFAULT_CACHE, ...userConfig.cache };
  } else {
    cache = { ...DEFAULT_CACHE };
  }

  // -- Retry: honour explicit `false` to disable --
  let retry: ResolvedRetryConfig | false;
  if (userConfig.retry === false) {
    retry = false;
  } else if (userConfig.retry) {
    retry = { ...DEFAULT_RETRY, ...userConfig.retry };
  } else {
    retry = { ...DEFAULT_RETRY };
  }

  // -- Strip trailing slash from baseUrl --
  const rawBaseUrl = userConfig.baseUrl ?? DEFAULT_CONFIG.baseUrl;
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');

  return {
    apiKey: userConfig.apiKey,
    tenantId: userConfig.tenantId,
    baseUrl,
    timeout: userConfig.timeout ?? DEFAULT_CONFIG.timeout,
    cache,
    retry,
    offline: userConfig.offline,
  };
}
