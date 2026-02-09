/**
 * @module tests/unit/config
 * @description Unit tests for resolveConfig and DEFAULT_CONFIG.
 */

import { describe, it, expect } from 'vitest';
import { resolveConfig, DEFAULT_CONFIG } from '../../src/config';

describe('resolveConfig', () => {
  it('should use default values when only apiKey is provided', () => {
    const resolved = resolveConfig({ apiKey: 'nx_test_key' });

    expect(resolved.apiKey).toBe('nx_test_key');
    expect(resolved.baseUrl).toBe(DEFAULT_CONFIG.baseUrl);
    expect(resolved.timeout).toBe(DEFAULT_CONFIG.timeout);
    expect(resolved.tenantId).toBeUndefined();

    // Cache defaults
    expect(resolved.cache).not.toBe(false);
    if (resolved.cache !== false) {
      expect(resolved.cache.max).toBe(DEFAULT_CONFIG.cache.max);
      expect(resolved.cache.ttl).toBe(DEFAULT_CONFIG.cache.ttl);
    }

    // Retry defaults
    expect(resolved.retry).not.toBe(false);
    if (resolved.retry !== false) {
      expect(resolved.retry.maxRetries).toBe(DEFAULT_CONFIG.retry.maxRetries);
      expect(resolved.retry.initialDelay).toBe(DEFAULT_CONFIG.retry.initialDelay);
      expect(resolved.retry.maxDelay).toBe(DEFAULT_CONFIG.retry.maxDelay);
      expect(resolved.retry.backoffFactor).toBe(DEFAULT_CONFIG.retry.backoffFactor);
    }
  });

  it('should allow custom baseUrl to override the default', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      baseUrl: 'https://api.example.com/v2',
    });

    expect(resolved.baseUrl).toBe('https://api.example.com/v2');
  });

  it('should strip trailing slashes from baseUrl', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      baseUrl: 'https://api.example.com/v2/',
    });

    expect(resolved.baseUrl).toBe('https://api.example.com/v2');
  });

  it('should strip multiple trailing slashes from baseUrl', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      baseUrl: 'https://api.example.com/v2///',
    });

    expect(resolved.baseUrl).toBe('https://api.example.com/v2');
  });

  it('should disable cache when cache is set to false', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      cache: false,
    });

    expect(resolved.cache).toBe(false);
  });

  it('should disable retry when retry is set to false', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      retry: false,
    });

    expect(resolved.retry).toBe(false);
  });

  it('should merge partial cache config with defaults', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      cache: { max: 500 },
    });

    expect(resolved.cache).not.toBe(false);
    if (resolved.cache !== false) {
      expect(resolved.cache.max).toBe(500);
      expect(resolved.cache.ttl).toBe(DEFAULT_CONFIG.cache.ttl); // default preserved
    }
  });

  it('should merge partial retry config with defaults', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      retry: { maxRetries: 5 },
    });

    expect(resolved.retry).not.toBe(false);
    if (resolved.retry !== false) {
      expect(resolved.retry.maxRetries).toBe(5);
      expect(resolved.retry.initialDelay).toBe(DEFAULT_CONFIG.retry.initialDelay);
      expect(resolved.retry.maxDelay).toBe(DEFAULT_CONFIG.retry.maxDelay);
      expect(resolved.retry.backoffFactor).toBe(DEFAULT_CONFIG.retry.backoffFactor);
    }
  });

  it('should allow custom timeout', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      timeout: 5000,
    });

    expect(resolved.timeout).toBe(5000);
  });

  it('should preserve tenantId when provided', () => {
    const resolved = resolveConfig({
      apiKey: 'nx_test_key',
      tenantId: 'tenant_abc',
    });

    expect(resolved.tenantId).toBe('tenant_abc');
  });

  it('should throw an error when apiKey is missing', () => {
    expect(() => resolveConfig({ apiKey: '' })).toThrow(
      'NexusConfig: "apiKey" is required and must be a non-empty string.',
    );
  });

  it('should throw an error when apiKey is undefined-like', () => {
    // @ts-expect-error -- intentionally passing invalid config for testing
    expect(() => resolveConfig({})).toThrow('apiKey');
  });
});
