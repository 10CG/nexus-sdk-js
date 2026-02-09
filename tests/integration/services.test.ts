/**
 * Integration tests for @nexus/sdk
 *
 * Tests the full call chain: NexusClient → Service → HttpClient → axios (mocked)
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

/** Wrap data in an axios-like response shape. */
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

describe('Integration: NexusClient → Services → HttpClient', () => {
  let client: NexusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
  });

  // ---- Context Service ----------------------------------------------------

  describe('ContextService', () => {
    it('retrieve() calls POST /context/retrieve with correct body', async () => {
      const mockResponse = {
        profile: { memories: [] },
        history: { messages: [] },
        graph: { entities: [] },
        meta: { took_ms: 42 },
      };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(mockResponse));

      const request = {
        user_id: 'user_42',
        query: 'user preferences',
        layers: ['semantic', 'graph'] as const,
      };

      const result = await client.context.retrieve(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/context/retrieve',
        request,
        expect.objectContaining({}),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ---- Memory Service -----------------------------------------------------

  describe('MemoryService', () => {
    it('create() calls POST /memories', async () => {
      const memory = { id: 'm1', content: 'test', memory_type: 'episodic' };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(memory));

      const result = await client.memories.create({
        user_id: 'u1',
        content: 'test',
        memory_type: 'episodic',
      } as any);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/memories',
        expect.objectContaining({ content: 'test' }),
        expect.anything(),
      );
      expect(result).toEqual(memory);
    });

    it('list() calls GET /memories with params', async () => {
      const list = { data: [], total: 0 };
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse(list));

      const result = await client.memories.list({ user_id: 'u1', limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/memories',
        expect.objectContaining({ params: { user_id: 'u1', limit: 10 } }),
      );
      expect(result).toEqual(list);
    });

    it('get() calls GET /memories/:id', async () => {
      const memory = { id: 'm1', content: 'hello' };
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse(memory));

      const result = await client.memories.get('m1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/memories/m1',
        expect.anything(),
      );
      expect(result).toEqual(memory);
    });

    it('delete() calls DELETE /memories/:id', async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce(axiosResponse(null));

      await client.memories.delete('m1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/memories/m1',
        expect.anything(),
      );
    });

    it('search() calls POST /memories/search', async () => {
      const results = { data: [], total: 0 };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(results));

      await client.memories.search({ query: 'hello', user_id: 'u1' } as any);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/memories/search',
        expect.objectContaining({ query: 'hello' }),
        expect.anything(),
      );
    });

    it('journal() calls GET /memories/journal', async () => {
      const journal = { entries: [] };
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse(journal));

      await client.memories.journal({ format: 'markdown' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/memories/journal',
        expect.objectContaining({ params: { format: 'markdown' } }),
      );
    });
  });

  // ---- Conversation Service -----------------------------------------------

  describe('ConversationService', () => {
    it('create() calls POST /conversations', async () => {
      const conv = { id: 'c1', user_id: 'u1' };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(conv));

      const result = await client.conversations.create({ user_id: 'u1' } as any);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/conversations',
        expect.objectContaining({ user_id: 'u1' }),
        expect.anything(),
      );
      expect(result).toEqual(conv);
    });

    it('addMessage() calls POST /conversations/:id/messages', async () => {
      const msg = { id: 'msg1', role: 'user', content: 'hi' };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(msg));

      await client.conversations.addMessage('c1', { role: 'user', content: 'hi' } as any);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/conversations/c1/messages',
        expect.objectContaining({ content: 'hi' }),
        expect.anything(),
      );
    });

    it('getSummary() calls GET /conversations/:id/summary', async () => {
      const summary = { summary: 'test summary' };
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse(summary));

      await client.conversations.getSummary('c1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/conversations/c1/summary',
        expect.anything(),
      );
    });
  });

  // ---- Knowledge Service --------------------------------------------------

  describe('KnowledgeService', () => {
    it('query() calls POST /knowledge/query', async () => {
      const graphResult = { paths: [], start_entity: 'e1' };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(graphResult));

      await client.knowledge.query({
        entity_name: 'Alice',
        max_depth: 2,
      } as any);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/knowledge/query',
        expect.objectContaining({ entity_name: 'Alice' }),
        expect.anything(),
      );
    });

    it('extract() calls POST /knowledge/extract', async () => {
      const extraction = { entities: [], relationships: [] };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(extraction));

      await client.knowledge.extract({ text: 'Alice knows Bob' } as any);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/knowledge/extract',
        expect.objectContaining({ text: 'Alice knows Bob' }),
        expect.anything(),
      );
    });
  });

  // ---- Activity Service ---------------------------------------------------

  describe('ActivityService', () => {
    it('stream() calls POST /activities/stream', async () => {
      const response = { accepted: 2, processed: 0, queued: 2 };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(response));

      await client.activities.stream({
        agent_id: 'coder',
        activities: [
          { action: 'edit_file', timestamp: '2026-02-08T10:00:00Z' } as any,
          { action: 'run_test', timestamp: '2026-02-08T10:01:00Z' } as any,
        ],
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/activities/stream',
        expect.objectContaining({ agent_id: 'coder' }),
        expect.anything(),
      );
    });

    it('log() wraps single activity into stream()', async () => {
      const response = { accepted: 1, processed: 0, queued: 1 };
      mockAxiosInstance.post.mockResolvedValueOnce(axiosResponse(response));

      await client.activities.log(
        { action: 'edit_file', timestamp: '2026-02-08T10:00:00Z' } as any,
        'my-agent',
      );

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/activities/stream',
        expect.objectContaining({
          agent_id: 'my-agent',
          activities: expect.arrayContaining([
            expect.objectContaining({ action: 'edit_file' }),
          ]),
        }),
        expect.anything(),
      );
    });
  });

  // ---- Tenant Service -----------------------------------------------------

  describe('TenantService', () => {
    it('me() calls GET /tenants/me', async () => {
      const tenant = { id: 't1', name: 'Test Tenant' };
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse(tenant));

      const result = await client.tenants.me();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/tenants/me',
        expect.anything(),
      );
      expect(result).toEqual(tenant);
    });

    it('usage() calls GET /tenants/me/usage', async () => {
      const usage = { api_calls_today: 100, memories_count: 50 };
      mockAxiosInstance.get.mockResolvedValueOnce(axiosResponse(usage));

      const result = await client.tenants.usage();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/tenants/me/usage',
        expect.anything(),
      );
      expect(result).toEqual(usage);
    });
  });
});
