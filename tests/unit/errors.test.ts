/**
 * @module tests/unit/errors
 * @description Unit tests for NexusError, ApiError, and all subclasses.
 */

import { describe, it, expect } from 'vitest';
import type { AxiosResponse } from 'axios';

import {
  NexusError,
  ConfigurationError,
  NetworkError,
  TimeoutError,
} from '../../src/errors/base';
import {
  ApiError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
} from '../../src/errors/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal AxiosResponse-like object for testing ApiError.fromResponse.
 */
function fakeResponse(
  status: number,
  data: unknown = {},
  headers: Record<string, string> = {},
): AxiosResponse {
  return {
    status,
    data,
    headers,
    statusText: '',
    config: {} as any,
  };
}

// ---------------------------------------------------------------------------
// NexusError (base)
// ---------------------------------------------------------------------------

describe('NexusError', () => {
  it('should set name to NexusError', () => {
    const err = new NexusError('something broke', 'TEST_CODE');
    expect(err.name).toBe('NexusError');
  });

  it('should set code correctly', () => {
    const err = new NexusError('msg', 'MY_CODE');
    expect(err.code).toBe('MY_CODE');
  });

  it('should set message correctly', () => {
    const err = new NexusError('hello world', 'C');
    expect(err.message).toBe('hello world');
  });

  it('should store the cause when provided', () => {
    const original = new Error('root cause');
    const err = new NexusError('wrapper', 'C', original);
    expect(err.cause).toBe(original);
  });

  it('should leave cause undefined when not provided', () => {
    const err = new NexusError('msg', 'C');
    expect(err.cause).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    const err = new NexusError('msg', 'C');
    expect(err).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// ApiError.fromResponse
// ---------------------------------------------------------------------------

describe('ApiError.fromResponse', () => {
  it('should return ValidationError for status 400', () => {
    const res = fakeResponse(400, { detail: 'bad input' });
    const err = ApiError.fromResponse(res);

    expect(err).toBeInstanceOf(ValidationError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('bad input');
  });

  it('should return AuthenticationError for status 401', () => {
    const res = fakeResponse(401, { detail: 'invalid token' });
    const err = ApiError.fromResponse(res);

    expect(err).toBeInstanceOf(AuthenticationError);
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('invalid token');
  });

  it('should return NotFoundError for status 404', () => {
    const res = fakeResponse(404, { detail: 'not found' });
    const err = ApiError.fromResponse(res);

    expect(err).toBeInstanceOf(NotFoundError);
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('not found');
  });

  it('should return RateLimitError for status 429', () => {
    const res = fakeResponse(429, { detail: 'slow down' }, { 'retry-after': '30' });
    const err = ApiError.fromResponse(res);

    expect(err).toBeInstanceOf(RateLimitError);
    expect(err.statusCode).toBe(429);
    expect(err.message).toBe('slow down');
  });

  it('should return a generic ApiError for status 500', () => {
    const res = fakeResponse(500, { detail: 'internal error' });
    const err = ApiError.fromResponse(res);

    expect(err).toBeInstanceOf(ApiError);
    // Should NOT be one of the specific subclasses
    expect(err.constructor).toBe(ApiError);
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe('internal error');
  });

  it('should use fallback message when body has no detail or message', () => {
    const res = fakeResponse(400, {});
    const err = ApiError.fromResponse(res);

    expect(err.message).toBe('Validation failed');
  });

  it('should use fallback message for non-object body', () => {
    const res = fakeResponse(401, null);
    const err = ApiError.fromResponse(res);

    expect(err.message).toBe('Authentication failed');
  });

  it('should preserve validation details from the response body', () => {
    const details = { email: ['invalid format'] };
    const res = fakeResponse(400, { detail: 'Validation failed', errors: details });
    const err = ApiError.fromResponse(res) as ValidationError;

    expect(err.details).toEqual(details);
  });
});

// ---------------------------------------------------------------------------
// RateLimitError -- retryAfter parsing
// ---------------------------------------------------------------------------

describe('RateLimitError', () => {
  it('should parse retryAfter from the Retry-After header', () => {
    const res = fakeResponse(429, {}, { 'retry-after': '60' });
    const err = ApiError.fromResponse(res) as RateLimitError;

    expect(err.retryAfter).toBe(60);
  });

  it('should leave retryAfter undefined when header is absent', () => {
    const res = fakeResponse(429, {});
    const err = ApiError.fromResponse(res) as RateLimitError;

    expect(err.retryAfter).toBeUndefined();
  });

  it('should have the correct error code', () => {
    const err = new RateLimitError('too fast', 10);
    expect(err.code).toBe('NEXUS_RATE_LIMIT_ERROR');
  });
});

// ---------------------------------------------------------------------------
// instanceof chain
// ---------------------------------------------------------------------------

describe('instanceof chain', () => {
  it('AuthenticationError should be instanceof ApiError', () => {
    const err = new AuthenticationError('no auth');
    expect(err).toBeInstanceOf(ApiError);
  });

  it('AuthenticationError should be instanceof NexusError', () => {
    const err = new AuthenticationError('no auth');
    expect(err).toBeInstanceOf(NexusError);
  });

  it('AuthenticationError should be instanceof Error', () => {
    const err = new AuthenticationError('no auth');
    expect(err).toBeInstanceOf(Error);
  });

  it('RateLimitError should be instanceof ApiError', () => {
    const err = new RateLimitError('slow down');
    expect(err).toBeInstanceOf(ApiError);
  });

  it('RateLimitError should be instanceof NexusError', () => {
    const err = new RateLimitError('slow down');
    expect(err).toBeInstanceOf(NexusError);
  });

  it('ValidationError should be instanceof ApiError and NexusError', () => {
    const err = new ValidationError('bad data');
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(NexusError);
  });

  it('NotFoundError should be instanceof ApiError and NexusError', () => {
    const err = new NotFoundError('gone');
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(NexusError);
  });

  it('ConfigurationError should be instanceof NexusError but not ApiError', () => {
    const err = new ConfigurationError('bad config');
    expect(err).toBeInstanceOf(NexusError);
    expect(err).not.toBeInstanceOf(ApiError);
  });

  it('NetworkError should be instanceof NexusError but not ApiError', () => {
    const err = new NetworkError('offline');
    expect(err).toBeInstanceOf(NexusError);
    expect(err).not.toBeInstanceOf(ApiError);
  });

  it('TimeoutError should be instanceof NexusError but not ApiError', () => {
    const err = new TimeoutError('timed out');
    expect(err).toBeInstanceOf(NexusError);
    expect(err).not.toBeInstanceOf(ApiError);
  });
});
