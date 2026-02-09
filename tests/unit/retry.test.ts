/**
 * @module tests/unit/retry
 * @description Unit tests for RetryManager: retryable detection, exponential
 * back-off delay calculation, and execute() retry logic.
 */

import { describe, it, expect, vi } from 'vitest';

import { RetryManager } from '../../src/http/retry';
import { NetworkError, TimeoutError } from '../../src/errors/base';
import { ApiError, RateLimitError } from '../../src/errors/api';
import type { ResolvedRetryConfig } from '../../src/config';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const DEFAULT_RETRY_CONFIG: ResolvedRetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10_000,
  backoffFactor: 2,
};

/** Config with minimal delays for execute() tests (avoids fake timers). */
const FAST_RETRY_CONFIG: ResolvedRetryConfig = {
  maxRetries: 3,
  initialDelay: 1,
  maxDelay: 10,
  backoffFactor: 2,
};

// ---------------------------------------------------------------------------
// Successful request -- no retry
// ---------------------------------------------------------------------------

describe('RetryManager - successful request', () => {
  it('should return the result without retrying on success', async () => {
    const manager = new RetryManager(DEFAULT_RETRY_CONFIG);
    const fn = vi.fn().mockResolvedValue('ok');

    const result = await manager.execute(fn);

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// isRetryable
// ---------------------------------------------------------------------------

describe('RetryManager.isRetryable', () => {
  const manager = new RetryManager(DEFAULT_RETRY_CONFIG);

  it('should return true for NetworkError', () => {
    expect(manager.isRetryable(new NetworkError('offline'))).toBe(true);
  });

  it('should return true for TimeoutError', () => {
    expect(manager.isRetryable(new TimeoutError('timed out'))).toBe(true);
  });

  it('should return false for 401 ApiError (AuthenticationError)', () => {
    const err = new ApiError('unauthorized', 401);
    expect(manager.isRetryable(err)).toBe(false);
  });

  it('should return true for RateLimitError (429)', () => {
    expect(manager.isRetryable(new RateLimitError('slow down'))).toBe(true);
  });

  it('should return true for 500 ApiError', () => {
    const err = new ApiError('server error', 500);
    expect(manager.isRetryable(err)).toBe(true);
  });

  it('should return true for 502 ApiError', () => {
    const err = new ApiError('bad gateway', 502);
    expect(manager.isRetryable(err)).toBe(true);
  });

  it('should return true for 503 ApiError', () => {
    const err = new ApiError('service unavailable', 503);
    expect(manager.isRetryable(err)).toBe(true);
  });

  it('should return false for 400 ApiError', () => {
    const err = new ApiError('bad request', 400);
    expect(manager.isRetryable(err)).toBe(false);
  });

  it('should return false for 404 ApiError', () => {
    const err = new ApiError('not found', 404);
    expect(manager.isRetryable(err)).toBe(false);
  });

  it('should return false for a generic Error', () => {
    expect(manager.isRetryable(new Error('unknown'))).toBe(false);
  });

  it('should return false for a string', () => {
    expect(manager.isRetryable('some error')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// execute() -- retry behaviour (uses minimal delays to avoid fake timers)
// ---------------------------------------------------------------------------

describe('RetryManager.execute', () => {
  it('should retry and succeed after transient failure', async () => {
    const manager = new RetryManager(FAST_RETRY_CONFIG);
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError('offline'))
      .mockResolvedValue('recovered');

    const result = await manager.execute(fn);
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw immediately for non-retryable errors', async () => {
    const manager = new RetryManager(FAST_RETRY_CONFIG);
    const clientError = new ApiError('bad request', 400);
    const fn = vi.fn().mockRejectedValue(clientError);

    await expect(manager.execute(fn)).rejects.toThrow(clientError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should throw the last error after exhausting maxRetries', async () => {
    const config: ResolvedRetryConfig = {
      maxRetries: 2,
      initialDelay: 1,
      maxDelay: 10,
      backoffFactor: 2,
    };
    const manager = new RetryManager(config);
    const serverError = new ApiError('server error', 500);
    const fn = vi.fn().mockRejectedValue(serverError);

    await expect(manager.execute(fn)).rejects.toThrow(serverError);
    // 1 initial + 2 retries = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// config=false -- retries disabled
// ---------------------------------------------------------------------------

describe('RetryManager with config=false', () => {
  it('should execute the function exactly once without retrying', async () => {
    const manager = new RetryManager(false);
    const fn = vi.fn().mockResolvedValue('direct');

    const result = await manager.execute(fn);

    expect(result).toBe('direct');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should propagate errors without retrying when disabled', async () => {
    const manager = new RetryManager(false);
    const error = new NetworkError('offline');
    const fn = vi.fn().mockRejectedValue(error);

    await expect(manager.execute(fn)).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// getDelay -- exponential back-off calculation
// ---------------------------------------------------------------------------

describe('RetryManager.getDelay', () => {
  it('should return 0 when config is false', () => {
    const manager = new RetryManager(false);
    expect(manager.getDelay(0)).toBe(0);
    expect(manager.getDelay(5)).toBe(0);
  });

  it('should compute exponential back-off for attempt 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // jitter factor = 0.9 + 0.5*0.2 = 1.0
    const manager = new RetryManager(DEFAULT_RETRY_CONFIG);

    // attempt 0: initialDelay * backoffFactor^0 = 1000 * 1 = 1000
    // with jitter factor 1.0: 1000
    const delay = manager.getDelay(0);
    expect(delay).toBe(1000);

    vi.restoreAllMocks();
  });

  it('should compute exponential back-off for attempt 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // jitter factor = 1.0
    const manager = new RetryManager(DEFAULT_RETRY_CONFIG);

    // attempt 1: 1000 * 2^1 = 2000, jitter 1.0 => 2000
    const delay = manager.getDelay(1);
    expect(delay).toBe(2000);

    vi.restoreAllMocks();
  });

  it('should compute exponential back-off for attempt 2', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // jitter factor = 1.0
    const manager = new RetryManager(DEFAULT_RETRY_CONFIG);

    // attempt 2: 1000 * 2^2 = 4000, jitter 1.0 => 4000
    const delay = manager.getDelay(2);
    expect(delay).toBe(4000);

    vi.restoreAllMocks();
  });

  it('should clamp delay to maxDelay', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // jitter factor = 1.0
    const manager = new RetryManager(DEFAULT_RETRY_CONFIG);

    // attempt 10: 1000 * 2^10 = 1024000, clamped to maxDelay=10000
    const delay = manager.getDelay(10);
    expect(delay).toBe(10_000);

    vi.restoreAllMocks();
  });

  it('should use retryAfter from RateLimitError when available', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // jitter factor = 1.0
    const manager = new RetryManager(DEFAULT_RETRY_CONFIG);
    const error = new RateLimitError('slow down', 5); // 5 seconds

    // retryAfter=5 => 5000ms, jitter 1.0 => 5000
    const delay = manager.getDelay(0, error);
    expect(delay).toBe(5000);

    vi.restoreAllMocks();
  });

  it('should apply jitter within +/-10% range', () => {
    const manager = new RetryManager(DEFAULT_RETRY_CONFIG);

    // Run multiple times to verify jitter is applied
    const delays: number[] = [];
    for (let i = 0; i < 20; i++) {
      delays.push(manager.getDelay(0));
    }

    // attempt 0: base = 1000, jitter range = [900, 1100]
    for (const d of delays) {
      expect(d).toBeGreaterThanOrEqual(900);
      expect(d).toBeLessThanOrEqual(1100);
    }
  });
});
