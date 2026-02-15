/**
 * Tests for AbortSignal passthrough to all Service methods.
 *
 * Verifies that every service method correctly forwards the signal
 * parameter from RequestOptions to the underlying HttpClient call.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock axios
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

function createClient(): NexusClient {
  return new NexusClient({
    apiKey: 'nx_test_key',
    cache: false,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AbortSignal passthrough to Service methods', () => {
  let client: NexusClient;
  let controller: AbortController;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
    controller = new AbortController();
  });

  // ---- Context Service ----------------------------------------------------

  describe('ContextService', () => {
    it('retrieve() passes signal to http.post', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ profile: {} }));

      await client.context.retrieve(
        { user_id: 'u1', query: 'test' } as any,
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/context/retrieve',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  // ---- Memory Service -----------------------------------------------------

  describe('MemoryService', () => {
    it('create() passes signal to http.post', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ id: 'm1' }));

      await client.memories.create(
        { user_id: 'u1', content: 'test', memory_type: 'episodic' } as any,
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/memories',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('list() passes signal to http.get', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse({ data: [] }));

      await client.memories.list({ user_id: 'u1' }, { signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/memories',
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('get() passes signal to http.get', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse({ id: 'm1' }));

      await client.memories.get('m1', { signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/memories/m1',
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('delete() passes signal to http.delete', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce(axiosResponse(null));

      await client.memories.delete('m1', { signal: controller.signal });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/memories/m1',
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('search() passes signal to http.post', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ data: [] }));

      await client.memories.search(
        { user_id: 'u1', query: 'test' } as any,
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/memories/search',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('journal() passes signal to http.get', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse({ entries: [] }));

      await client.memories.journal({ format: 'json' }, { signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/memories/journal',
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  // ---- Conversation Service -----------------------------------------------

  describe('ConversationService', () => {
    it('create() passes signal to http.post', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ id: 'c1' }));

      await client.conversations.create(
        { user_id: 'u1' } as any,
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/conversations',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('getSummary() passes signal to http.get', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse({ summary: 'test' }));

      await client.conversations.getSummary('c1', { signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/conversations/c1/summary',
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('delete() passes signal to http.delete', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce(axiosResponse(null));

      await client.conversations.delete('c1', { signal: controller.signal });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/conversations/c1',
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  // ---- Knowledge Service --------------------------------------------------

  describe('KnowledgeService', () => {
    it('createEntity() passes signal to http.post', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ entity_id: 'e1' }));

      await client.knowledge.createEntity(
        { name: 'Alice', entity_type: 'Person' },
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/knowledge/entities',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('query() passes signal to http.post', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ paths: [] }));

      await client.knowledge.query(
        { entity_name: 'Alice', max_depth: 2 } as any,
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/knowledge/query',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  // ---- Activity Service ---------------------------------------------------

  describe('ActivityService', () => {
    it('stream() passes signal to http.post', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ accepted: 1 }));

      await client.activities.stream(
        { agent_id: 'a1', activities: [] },
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/activities/stream',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('log() passes signal through stream()', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse({ accepted: 1 }));

      await client.activities.log(
        { action: 'edit_file', timestamp: '2026-01-01T00:00:00Z' } as any,
        'agent-1',
        { signal: controller.signal },
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/activities/stream',
        expect.anything(),
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  // ---- Tenant Service -----------------------------------------------------

  describe('TenantService', () => {
    it('me() passes signal to http.get', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse({ id: 't1' }));

      await client.tenants.me({ signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/tenants/me',
        expect.objectContaining({ signal: controller.signal }),
      );
    });

    it('usage() passes signal to http.get', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse({ api_calls_today: 0 }));

      await client.tenants.usage({ signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/tenants/me/usage',
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });
});
