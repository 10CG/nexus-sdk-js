/**
 * @module tests/unit/cache
 * @description Unit tests for CacheManager.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager, isCacheablePost } from '../../src/http/cache';
import type { ResolvedCacheConfig } from '../../src/config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_CACHE_CONFIG: ResolvedCacheConfig = {
  max: 100,
  ttl: 300, // 5 minutes
};

// ---------------------------------------------------------------------------
// CacheManager (enabled)
// ---------------------------------------------------------------------------

describe('CacheManager (enabled)', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(DEFAULT_CACHE_CONFIG);
  });

  it('should return undefined on cache miss', () => {
    const result = cache.get<string>('nonexistent-key');

    expect(result).toBeUndefined();
  });

  it('should return cached data on cache hit after set', () => {
    const data = { memories: [{ id: '1', content: 'hello' }] };
    const key = 'test-key';

    cache.set(key, data);
    const result = cache.get<typeof data>(key);

    expect(result).toEqual(data);
  });

  it('should track hits correctly', () => {
    cache.set('key1', 'value1');

    cache.get('key1'); // hit
    cache.get('key1'); // hit

    expect(cache.stats.hits).toBe(2);
  });

  it('should track misses correctly', () => {
    cache.get('missing1'); // miss
    cache.get('missing2'); // miss

    expect(cache.stats.misses).toBe(2);
  });

  it('should track combined hits and misses', () => {
    cache.set('key1', 'value1');

    cache.get('key1');    // hit
    cache.get('missing'); // miss
    cache.get('key1');    // hit

    expect(cache.stats.hits).toBe(2);
    expect(cache.stats.misses).toBe(1);
  });

  it('should report correct size', () => {
    expect(cache.stats.size).toBe(0);

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.stats.size).toBe(2);
  });

  it('should invalidate entries matching a pattern', () => {
    cache.set('GET:/memories/search:abc', { data: 'mem1' });
    cache.set('GET:/memories/list:def', { data: 'mem2' });
    cache.set('GET:/context/retrieve:ghi', { data: 'ctx1' });

    cache.invalidate('memories');

    expect(cache.get('GET:/memories/search:abc')).toBeUndefined();
    expect(cache.get('GET:/memories/list:def')).toBeUndefined();
    // Context entry should remain
    expect(cache.get('GET:/context/retrieve:ghi')).toEqual({ data: 'ctx1' });
  });

  it('should clear all entries and reset counters', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.get('key1'); // hit

    cache.clear();

    expect(cache.stats.size).toBe(0);
    expect(cache.stats.hits).toBe(0);
    expect(cache.stats.misses).toBe(0);
    expect(cache.get('key1')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// CacheManager.generateKey
// ---------------------------------------------------------------------------

describe('CacheManager.generateKey', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(DEFAULT_CACHE_CONFIG);
  });

  it('should generate a stable key for the same inputs', () => {
    const key1 = cache.generateKey('GET', '/memories', { user_id: 'u1' });
    const key2 = cache.generateKey('GET', '/memories', { user_id: 'u1' });

    expect(key1).toBe(key2);
  });

  it('should generate different keys for different methods', () => {
    const key1 = cache.generateKey('GET', '/memories', { user_id: 'u1' });
    const key2 = cache.generateKey('POST', '/memories', { user_id: 'u1' });

    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different paths', () => {
    const key1 = cache.generateKey('GET', '/memories', { user_id: 'u1' });
    const key2 = cache.generateKey('GET', '/context', { user_id: 'u1' });

    expect(key1).not.toBe(key2);
  });

  it('should generate different keys for different params', () => {
    const key1 = cache.generateKey('GET', '/memories', { user_id: 'u1' });
    const key2 = cache.generateKey('GET', '/memories', { user_id: 'u2' });

    expect(key1).not.toBe(key2);
  });

  it('should generate the same key regardless of object key order', () => {
    const key1 = cache.generateKey('POST', '/search', { a: 1, b: 2 });
    const key2 = cache.generateKey('POST', '/search', { b: 2, a: 1 });

    expect(key1).toBe(key2);
  });

  it('should generate a key without hash when params are undefined', () => {
    const key = cache.generateKey('GET', '/memories');

    expect(key).toBe('GET:/memories');
  });

  it('should generate a key without hash when params are null', () => {
    const key = cache.generateKey('GET', '/memories', null);

    expect(key).toBe('GET:/memories');
  });
});

// ---------------------------------------------------------------------------
// CacheManager (disabled)
// ---------------------------------------------------------------------------

describe('CacheManager (disabled)', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(false);
  });

  it('should return undefined on get (no-op)', () => {
    const result = cache.get<string>('any-key');

    expect(result).toBeUndefined();
  });

  it('should not store values on set (no-op)', () => {
    cache.set('key', 'value');
    const result = cache.get<string>('key');

    expect(result).toBeUndefined();
  });

  it('should not throw on invalidate (no-op)', () => {
    expect(() => cache.invalidate('pattern')).not.toThrow();
  });

  it('should not throw on clear (no-op)', () => {
    expect(() => cache.clear()).not.toThrow();
  });

  it('should report zero stats', () => {
    expect(cache.stats).toEqual({ size: 0, hits: 0, misses: 0 });
  });
});

// ---------------------------------------------------------------------------
// isCacheablePost
// ---------------------------------------------------------------------------

describe('isCacheablePost', () => {
  it('should return true for /context/retrieve', () => {
    expect(isCacheablePost('/context/retrieve')).toBe(true);
  });

  it('should return true for /memories/search', () => {
    expect(isCacheablePost('/memories/search')).toBe(true);
  });

  it('should return true for /knowledge/query', () => {
    expect(isCacheablePost('/knowledge/query')).toBe(true);
  });

  it('should return false for /memories (write endpoint)', () => {
    expect(isCacheablePost('/memories')).toBe(false);
  });

  it('should return false for /conversations', () => {
    expect(isCacheablePost('/conversations')).toBe(false);
  });
});
