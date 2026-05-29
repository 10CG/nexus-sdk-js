/**
 * @module http/cache
 * @description LRU cache layer for the Nexus SDK HTTP client.
 *
 * Provides transparent caching for GET requests and specific read-oriented
 * POST endpoints (e.g. `/context/retrieve`, `/memories/search`,
 * `/knowledge/query`). Write operations automatically invalidate related
 * cache entries by path prefix.
 *
 * When caching is disabled (`config === false`), every method is a no-op
 * with zero overhead.
 */

import { LRUCache } from 'lru-cache';

import type { ResolvedCacheConfig } from '../config';

// ---------------------------------------------------------------------------
// Cacheable POST endpoints
// ---------------------------------------------------------------------------

/**
 * POST paths that are semantically read-only and therefore safe to cache.
 * These endpoints perform search / retrieval operations via POST bodies.
 */
const CACHEABLE_POST_PATHS: ReadonlySet<string> = new Set([
  '/context/retrieve',
  '/memories/search',
  '/knowledge/query',
]);

/**
 * Check whether a POST request to the given path is eligible for caching.
 */
export function isCacheablePost(path: string): boolean {
  return CACHEABLE_POST_PATHS.has(path);
}

// ---------------------------------------------------------------------------
// Stable hashing
// ---------------------------------------------------------------------------

/**
 * Produce a deterministic hash string from an arbitrary value.
 *
 * The value is first serialised to JSON with sorted keys so that
 * `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` yield the same hash.
 * The hash itself is a simple DJB2-style numeric hash converted to
 * a base-36 string -- fast and collision-resistant enough for cache keys.
 */
function stableHash(value: unknown): string {
  const json = JSON.stringify(value, (_key, val) => {
    // Sort object keys for deterministic serialisation
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      return Object.keys(val as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((sorted, k) => {
          sorted[k] = (val as Record<string, unknown>)[k];
          return sorted;
        }, {});
    }
    return val;
  });

  // DJB2 hash
  let hash = 5381;
  for (let i = 0; i < json.length; i++) {
    // hash * 33 + charCode
    hash = ((hash << 5) + hash + json.charCodeAt(i)) | 0;
  }

  // Convert to unsigned 32-bit then base-36 for a compact string
  return (hash >>> 0).toString(36);
}

// ---------------------------------------------------------------------------
// CacheManager
// ---------------------------------------------------------------------------

/**
 * LRU cache manager for the Nexus SDK.
 *
 * Wraps the `lru-cache` library and adds:
 * - Stable key generation from method + path + params/body
 * - Pattern-based invalidation for write-after-read consistency
 * - Hit / miss counters for observability
 * - Graceful no-op behaviour when caching is disabled
 *
 * @example
 * ```typescript
 * const cache = new CacheManager({ max: 500, ttl: 120 });
 *
 * const key = cache.generateKey('GET', '/memories', { user_id: 'u1' });
 * cache.set(key, [{ id: '1', content: 'hello' }]);
 *
 * const hit = cache.get<Memory[]>(key); // => [{ id: '1', ... }]
 * console.log(cache.stats); // { size: 1, hits: 1, misses: 0 }
 * ```
 */
export class CacheManager {
  /**
   * Underlying LRU cache instance.
   *
   * The value type is `NonNullable<unknown>` (≡ `{}`, any non-null/
   * non-undefined value) rather than `unknown` because `lru-cache` v10+
   * constrains its value parameter to `V extends {}` — `unknown` does not
   * satisfy that constraint (TS2344). `NonNullable<unknown>` is used instead
   * of the bare `{}` literal so it reads as intentional and doesn't trip
   * `@typescript-eslint/no-empty-object-type`. Cache values are never null/
   * undefined by construction (`get` returns `undefined` only on a miss, and
   * we never `set` a nullish value). The public API still exposes `unknown`
   * via the generic `get<T>` and `set(value: unknown)` signatures; the
   * narrowing happens at those boundaries.
   */
  private readonly cache: LRUCache<string, NonNullable<unknown>>;

  /** Whether caching is active. */
  private readonly enabled: boolean;

  /** Running hit counter. */
  private _hits = 0;

  /** Running miss counter. */
  private _misses = 0;

  /**
   * Create a new cache manager.
   *
   * @param config - Resolved cache configuration, or `false` to disable.
   */
  constructor(config: ResolvedCacheConfig | false) {
    if (config === false) {
      this.enabled = false;
      // Minimal placeholder -- never actually used
      this.cache = new LRUCache<string, NonNullable<unknown>>({ max: 1 });
    } else {
      this.enabled = true;
      this.cache = new LRUCache<string, NonNullable<unknown>>({
        max: config.max,
        ttl: config.ttl * 1000, // seconds -> milliseconds
      });
    }
  }

  // -----------------------------------------------------------------------
  // Key generation
  // -----------------------------------------------------------------------

  /**
   * Generate a deterministic cache key from the request signature.
   *
   * Format: `METHOD:path:hash(params)`
   *
   * @param method - HTTP method (e.g. `GET`, `POST`).
   * @param path   - Request path (e.g. `/memories/search`).
   * @param params - Query parameters or request body (optional).
   * @returns A string suitable for use as a cache key.
   */
  generateKey(method: string, path: string, params?: unknown): string {
    const base = `${method.toUpperCase()}:${path}`;
    if (params === undefined || params === null) {
      return base;
    }
    return `${base}:${stableHash(params)}`;
  }

  // -----------------------------------------------------------------------
  // Core operations
  // -----------------------------------------------------------------------

  /**
   * Retrieve a cached value.
   *
   * @typeParam T - Expected type of the cached value.
   * @param key - Cache key (as returned by {@link generateKey}).
   * @returns The cached value, or `undefined` on a miss.
   */
  get<T>(key: string): T | undefined {
    if (!this.enabled) {
      return undefined;
    }

    const value = this.cache.get(key);
    if (value !== undefined) {
      this._hits++;
      return value as T;
    }

    this._misses++;
    return undefined;
  }

  /**
   * Store a value in the cache.
   *
   * @param key   - Cache key.
   * @param value - Value to cache.
   */
  set(key: string, value: unknown): void {
    if (!this.enabled) {
      return;
    }
    // The public contract accepts `unknown`, but the underlying cache stores
    // non-null values (see the `cache` field doc). Callers never cache a
    // nullish value; cast at this single boundary.
    this.cache.set(key, value as NonNullable<unknown>);
  }

  /**
   * Invalidate all cache entries whose key contains the given pattern.
   *
   * This is typically called after a write operation to evict stale
   * read results. For example, after `POST /memories`, calling
   * `invalidate('/memories')` removes all cached memory queries.
   *
   * @param pattern - Substring to match against cache keys.
   */
  invalidate(pattern: string): void {
    if (!this.enabled) {
      return;
    }

    // Iterate over all keys and delete those that contain the pattern.
    // LRUCache exposes keys via the keys() iterator.
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Remove all entries from the cache and reset counters.
   */
  clear(): void {
    if (!this.enabled) {
      return;
    }
    this.cache.clear();
    this._hits = 0;
    this._misses = 0;
  }

  // -----------------------------------------------------------------------
  // Observability
  // -----------------------------------------------------------------------

  /**
   * Current cache statistics.
   *
   * Useful for logging, health checks, and dashboards.
   */
  get stats(): { size: number; hits: number; misses: number } {
    return {
      size: this.enabled ? this.cache.size : 0,
      hits: this._hits,
      misses: this._misses,
    };
  }
}
