/**
 * Tests for `ContextRequest.as_of` (v1.3.0, US-037 Wave 1 TASK-005, US-037c).
 *
 * Two scopes:
 *   1. zod schema — accepts RFC 3339 with offset, rejects naive datetimes
 *      and other malformed input.
 *   2. End-to-end round-trip — `as_of` survives through ContextService.retrieve
 *      into the HTTP body unchanged (no client-side mutation).
 *
 * The AbortSignal contract for ContextService is already covered by
 * `services-signal.test.ts`; this file is scoped to the new field.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock axios — same pattern as services-signal.test.ts for symmetry
// ---------------------------------------------------------------------------
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isCancel: vi.fn(() => false),
  },
}));

import { NexusClient } from '../../src/client';
import { contextRequestSchema } from '../../src/schemas/context';
import { InputValidationError } from '../../src/errors/validation';

function axiosResponse(data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
}

function createClient(): NexusClient {
  return new NexusClient({
    apiKey: 'nx_test_key',
    cache: false,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// 1. Schema-level validation
// ---------------------------------------------------------------------------

describe('contextRequestSchema.as_of validation', () => {
  it('accepts RFC 3339 datetime with `Z` offset', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts RFC 3339 datetime with explicit `+00:00` offset', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: '2026-01-01T00:00:00+00:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts RFC 3339 datetime with non-zero offset', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: '2026-05-09T15:30:45+08:00',
    });
    expect(result.success).toBe(true);
  });

  it('accepts RFC 3339 with fractional seconds', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: '2026-01-01T00:00:00.123Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects naive datetime without timezone offset', () => {
    // This is the core ingest-boundary guard: a naive timestamp like
    // "2026-01-01T00:00:00" is silently interpreted as UTC by some HTTP
    // stacks and as local time by others, so the SDK refuses it outright.
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: '2026-01-01T00:00:00',
    });
    expect(result.success).toBe(false);
  });

  it('rejects date-only string (no time component)', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an obviously malformed value', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      as_of: 'yesterday',
    });
    expect(result.success).toBe(false);
  });

  it('treats omitted as_of as valid (field is optional)', () => {
    const result = contextRequestSchema.safeParse({ user_id: 'u1' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. End-to-end round-trip through ContextService.retrieve
// ---------------------------------------------------------------------------

describe('ContextService.retrieve as_of round-trip', () => {
  let client: NexusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
  });

  it('forwards as_of unchanged into the HTTP request body', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ profile: {} }));

    const asOf = '2026-01-01T00:00:00+00:00';
    await client.context.retrieve({
      user_id: 'u1',
      query: 'recall yesterday',
      as_of: asOf,
    });

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/context/retrieve',
      expect.objectContaining({ user_id: 'u1', as_of: asOf }),
      // HttpClient.post wraps signal in `{ signal }` even when caller passes
      // undefined (see src/http/client.ts ~L194); skip third-arg shape and
      // rely on services-signal.test.ts for the AbortSignal contract.
      expect.anything(),
    );
  });

  it('preserves as_of when a depth preset is also applied', async () => {
    // depth presets merge under-explicit; verify the merge does not drop as_of.
    mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ profile: {} }));

    const asOf = '2026-05-09T15:30:45+08:00';
    await client.context.retrieve({
      user_id: 'u1',
      depth: 'L3',
      as_of: asOf,
    });

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/context/retrieve',
      expect.objectContaining({
        user_id: 'u1',
        as_of: asOf,
        // L3 preset fields should also be present, confirming merge happened
        include_history: true,
        include_graph: true,
      }),
      expect.anything(),
    );
    // depth itself is a client-side convenience and must not leak to the wire.
    const sentBody = mockAxiosInstance.post.mock.calls[0]?.[1];
    expect(sentBody).not.toHaveProperty('depth');
  });

  it('does not include as_of in the request body when caller omits it', async () => {
    mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ profile: {} }));

    await client.context.retrieve({ user_id: 'u1' });

    const sentBody = mockAxiosInstance.post.mock.calls[0]?.[1];
    expect(sentBody).not.toHaveProperty('as_of');
  });

  it('rejects naive datetime via InputValidationError before any HTTP call', async () => {
    await expect(
      client.context.retrieve({
        user_id: 'u1',
        as_of: '2026-01-01T00:00:00',
      }),
    ).rejects.toBeInstanceOf(InputValidationError);

    expect(mockAxiosInstance.post).not.toHaveBeenCalled();
  });
});
