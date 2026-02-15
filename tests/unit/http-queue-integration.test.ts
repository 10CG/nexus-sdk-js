/**
 * Integration tests for OfflineQueue + HttpClient.
 *
 * Verifies that the HttpClient correctly enqueues requests when offline
 * and flushes them when transitioning back to online.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock axios before any imports that use it
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function axiosResponse(data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
}

function createOfflineClient(): NexusClient {
  return new NexusClient({
    apiKey: 'nx_test_key',
    cache: false,
    retry: false,
    offline: { enabled: true, maxQueueSize: 50 },
  });
}

function createNormalClient(): NexusClient {
  return new NexusClient({
    apiKey: 'nx_test_key',
    cache: false,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HttpClient + OfflineQueue Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should enqueue POST requests when offline', async () => {
    const client = createOfflineClient();
    client.setOnline(false);

    // POST should not hit axios -- it goes to the queue
    const pending = client.memories.create({
      user_id: 'u1',
      content: 'test',
      memory_type: 'episodic',
    } as any);

    expect(mockAxiosInstance.post).not.toHaveBeenCalled();
    expect(client.queue!.size).toBe(1);

    // Resolve by going online
    mockAxiosInstance.post.mockResolvedValueOnce(
      axiosResponse({ id: 'm1', content: 'test' }),
    );
    client.setOnline(true);

    const result = await pending;
    expect(result).toEqual({ id: 'm1', content: 'test' });
  });

  it('should auto-flush queued requests when transitioning offline -> online', async () => {
    const client = createOfflineClient();
    client.setOnline(false);

    const p1 = client.memories.create({
      user_id: 'u1',
      content: 'mem1',
      memory_type: 'episodic',
    } as any);
    const p2 = client.memories.delete('m2');

    expect(client.queue!.size).toBe(2);

    mockAxiosInstance.post.mockResolvedValueOnce(
      axiosResponse({ id: 'm1' }),
    );
    mockAxiosInstance.delete.mockResolvedValueOnce(
      axiosResponse(null),
    );

    client.setOnline(true);

    await expect(p1).resolves.toEqual({ id: 'm1' });
    await expect(p2).resolves.toBeNull();
    expect(client.queue!.size).toBe(0);
  });

  it('should send requests normally when online (offline enabled)', async () => {
    const client = createOfflineClient();
    // Default is online

    mockAxiosInstance.post.mockResolvedValueOnce(
      axiosResponse({ id: 'm1' }),
    );

    await client.memories.create({
      user_id: 'u1',
      content: 'test',
      memory_type: 'episodic',
    } as any);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/memories',
      expect.objectContaining({ content: 'test' }),
      expect.anything(),
    );
  });

  it('should send requests normally when offline config is not enabled', async () => {
    const client = createNormalClient();

    mockAxiosInstance.post.mockResolvedValueOnce(
      axiosResponse({ id: 'm1' }),
    );

    await client.memories.create({
      user_id: 'u1',
      content: 'test',
      memory_type: 'episodic',
    } as any);

    expect(mockAxiosInstance.post).toHaveBeenCalled();
  });

  it('should expose queue as undefined when offline is not enabled', () => {
    const client = createNormalClient();
    expect(client.queue).toBeUndefined();
  });

  it('should expose queue instance when offline is enabled', () => {
    const client = createOfflineClient();
    expect(client.queue).toBeDefined();
    expect(client.queue!.size).toBe(0);
  });
});
