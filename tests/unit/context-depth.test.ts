/**
 * Tests for the `depth` convenience parameter on ContextService.retrieve().
 *
 * Verifies:
 * 1. DEPTH_PRESETS has correct field values for every level.
 * 2. ContextService strips `depth` from the wire payload.
 * 3. Preset values are applied when depth is provided.
 * 4. Explicit caller fields override preset values.
 * 5. No depth → behaviour is unchanged.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock axios (same pattern as services-signal.test.ts)
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
import { DEPTH_PRESETS } from '../../src/types/context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function axiosResponse(data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
}

function createClient(): NexusClient {
  return new NexusClient({ apiKey: 'nx_test_key', cache: false, retry: false });
}

// ---------------------------------------------------------------------------
// DEPTH_PRESETS shape validation
// ---------------------------------------------------------------------------

describe('DEPTH_PRESETS', () => {
  it('L0: profile_limit=1, no history, no graph, empty layers', () => {
    expect(DEPTH_PRESETS.L0).toMatchObject({
      include_profile: true,
      profile_limit: 1,
      include_history: false,
      include_graph: false,
      layers: [],
    });
  });

  it('L1: profile_limit=3, no history, no graph, empty layers', () => {
    expect(DEPTH_PRESETS.L1).toMatchObject({
      include_profile: true,
      profile_limit: 3,
      include_history: false,
      include_graph: false,
      layers: [],
    });
  });

  it('L2: profile_limit=10, no history, no graph, semantic layer', () => {
    expect(DEPTH_PRESETS.L2).toMatchObject({
      include_profile: true,
      profile_limit: 10,
      include_history: false,
      include_graph: false,
      layers: ['semantic'],
    });
  });

  it('L3: profile_limit=20, history on, graph on, semantic+graph layers', () => {
    expect(DEPTH_PRESETS.L3).toMatchObject({
      include_profile: true,
      profile_limit: 20,
      include_history: true,
      include_graph: true,
      layers: ['semantic', 'graph'],
    });
  });
});

// ---------------------------------------------------------------------------
// ContextService.retrieve() with depth
// ---------------------------------------------------------------------------

describe('ContextService.retrieve() depth parameter', () => {
  let client: NexusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
    mockAxiosInstance.post.mockResolvedValue(axiosResponse({ profile: null }));
  });

  it('no depth: payload passes through unchanged (minus undefined depth)', async () => {
    await client.context.retrieve({ user_id: 'u1', query: 'hello' });

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload).toEqual({ user_id: 'u1', query: 'hello' });
    expect(payload).not.toHaveProperty('depth');
  });

  it('depth is never sent to the backend', async () => {
    await client.context.retrieve({ user_id: 'u1', depth: 'L2' } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload).not.toHaveProperty('depth');
  });

  it('L0: applies correct preset fields', async () => {
    await client.context.retrieve({ user_id: 'u1', depth: 'L0' } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload).toMatchObject({
      user_id: 'u1',
      include_profile: true,
      profile_limit: 1,
      include_history: false,
      include_graph: false,
      layers: [],
    });
  });

  it('L1: applies correct preset fields', async () => {
    await client.context.retrieve({ user_id: 'u1', depth: 'L1' } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload).toMatchObject({
      include_profile: true,
      profile_limit: 3,
      include_history: false,
      include_graph: false,
      layers: [],
    });
  });

  it('L2: applies semantic layer', async () => {
    await client.context.retrieve({ user_id: 'u1', depth: 'L2' } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload).toMatchObject({
      profile_limit: 10,
      layers: ['semantic'],
    });
  });

  it('L3: enables history and graph', async () => {
    await client.context.retrieve({ user_id: 'u1', depth: 'L3' } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload).toMatchObject({
      include_profile: true,
      profile_limit: 20,
      include_history: true,
      include_graph: true,
      layers: ['semantic', 'graph'],
    });
  });

  it('explicit profile_limit overrides preset value', async () => {
    // depth=L1 sets profile_limit=3, but caller passes 5 — caller wins
    await client.context.retrieve({ user_id: 'u1', depth: 'L1', profile_limit: 5 } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload.profile_limit).toBe(5);
  });

  it('explicit include_history overrides L3 preset', async () => {
    // L3 sets include_history=true, caller sets false — caller wins
    await client.context.retrieve({ user_id: 'u1', depth: 'L3', include_history: false } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload.include_history).toBe(false);
  });

  it('explicit layers overrides preset layers', async () => {
    // L2 sets layers=['semantic'], caller wants ['graph'] — caller wins
    await client.context.retrieve({ user_id: 'u1', depth: 'L2', layers: ['graph'] } as any);

    const [, payload] = mockAxiosInstance.post.mock.calls[0];
    expect(payload.layers).toEqual(['graph']);
  });

  it('calls the correct endpoint', async () => {
    await client.context.retrieve({ user_id: 'u1', depth: 'L1' } as any);

    const [endpoint] = mockAxiosInstance.post.mock.calls[0];
    expect(endpoint).toBe('/context/retrieve');
  });
});
