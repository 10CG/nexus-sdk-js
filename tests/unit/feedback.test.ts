/**
 * Tests for FeedbackService.
 *
 * Verifies:
 * 1. submit() calls PUT /feedback/{retrieveId} with the correct payload.
 * 2. list() calls GET /feedback with no query string when no params provided.
 * 3. list() builds the query string correctly for every supported param.
 * 4. list() omits params that are not supplied (partial params).
 * 5. AbortSignal is forwarded by both submit() and list().
 * 6. Type definitions: FeedbackSubmitRequest, FeedbackResponse, FeedbackListResponse.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock axios (same pattern as other unit tests)
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
import type {
  FeedbackSubmitRequest,
  FeedbackResponse,
  FeedbackListResponse,
  FeedbackListItem,
} from '../../src/types/feedback';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function axiosResponse(data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
}

function createClient(): NexusClient {
  return new NexusClient({ apiKey: 'nx_test_key', cache: false, retry: false });
}

const RETRIEVE_ID = 'retrieve-uuid-123';

const MOCK_FEEDBACK_RESPONSE: FeedbackResponse = {
  feedback_id: 'feedback-uuid-456',
  retrieve_id: RETRIEVE_ID,
  status: 'accepted',
  created_at: '2026-04-08T10:00:00Z',
};

const MOCK_LIST_ITEM: FeedbackListItem = {
  feedback_id: 'feedback-uuid-456',
  retrieve_id: RETRIEVE_ID,
  user_id: 'user-1',
  rating: 4,
  expected_missing: null,
  diagnosis_type: null,
  context_data: {},
  created_at: '2026-04-08T10:00:00Z',
};

const MOCK_LIST_RESPONSE: FeedbackListResponse = {
  feedbacks: [MOCK_LIST_ITEM],
  total_count: 1,
  limit: 20,
  offset: 0,
};

// ---------------------------------------------------------------------------
// FeedbackService.submit()
// ---------------------------------------------------------------------------

describe('FeedbackService.submit()', () => {
  let client: NexusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
    mockAxiosInstance.put.mockResolvedValue(axiosResponse(MOCK_FEEDBACK_RESPONSE));
  });

  it('calls PUT /feedback/{retrieveId}', async () => {
    await client.feedback.submit(RETRIEVE_ID, { rating: 4 });

    const [endpoint] = mockAxiosInstance.put.mock.calls[0];
    expect(endpoint).toBe(`/feedback/${RETRIEVE_ID}`);
  });

  it('passes the request body verbatim', async () => {
    const data: FeedbackSubmitRequest = {
      rating: 5,
      item_feedback: [{ memory_id: 'mem-uuid', useful: true, reason: 'very helpful' }],
      expected_missing: 'pricing info',
      context: { source: 'chat' },
    };

    await client.feedback.submit(RETRIEVE_ID, data);

    const [, payload] = mockAxiosInstance.put.mock.calls[0];
    expect(payload).toEqual(data);
  });

  it('returns the parsed FeedbackResponse', async () => {
    const result = await client.feedback.submit(RETRIEVE_ID, { rating: 3 });
    expect(result).toEqual(MOCK_FEEDBACK_RESPONSE);
  });

  it('works with minimal payload (rating only)', async () => {
    await client.feedback.submit(RETRIEVE_ID, { rating: 1 });

    const [, payload] = mockAxiosInstance.put.mock.calls[0];
    expect(payload).toEqual({ rating: 1 });
  });

  it('forwards AbortSignal', async () => {
    const controller = new AbortController();

    await client.feedback.submit(RETRIEVE_ID, { rating: 4 }, { signal: controller.signal });

    // axios.put is called as (path, data, config) — signal lives inside config
    const [, , config] = mockAxiosInstance.put.mock.calls[0];
    expect(config).toMatchObject({ signal: controller.signal });
  });
});

// ---------------------------------------------------------------------------
// FeedbackService.list()
// ---------------------------------------------------------------------------

describe('FeedbackService.list()', () => {
  let client: NexusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
    mockAxiosInstance.get.mockResolvedValue(axiosResponse(MOCK_LIST_RESPONSE));
  });

  it('calls GET /feedback with no query string when no params provided', async () => {
    await client.feedback.list();

    const [endpoint] = mockAxiosInstance.get.mock.calls[0];
    expect(endpoint).toBe('/feedback');
  });

  it('returns the parsed FeedbackListResponse', async () => {
    const result = await client.feedback.list();
    expect(result).toEqual(MOCK_LIST_RESPONSE);
  });

  it('appends user_id to query string', async () => {
    await client.feedback.list({ user_id: 'user-42' });

    const [endpoint] = mockAxiosInstance.get.mock.calls[0];
    expect(endpoint).toBe('/feedback?user_id=user-42');
  });

  it('appends limit to query string', async () => {
    await client.feedback.list({ limit: 10 });

    const [endpoint] = mockAxiosInstance.get.mock.calls[0];
    expect(endpoint).toBe('/feedback?limit=10');
  });

  it('appends offset to query string', async () => {
    await client.feedback.list({ offset: 40 });

    const [endpoint] = mockAxiosInstance.get.mock.calls[0];
    expect(endpoint).toBe('/feedback?offset=40');
  });

  it('appends all three params when all are provided', async () => {
    await client.feedback.list({ user_id: 'user-1', limit: 20, offset: 0 });

    const [endpoint] = mockAxiosInstance.get.mock.calls[0];
    const url = new URL(endpoint, 'http://localhost');
    expect(url.pathname).toBe('/feedback');
    expect(url.searchParams.get('user_id')).toBe('user-1');
    expect(url.searchParams.get('limit')).toBe('20');
    expect(url.searchParams.get('offset')).toBe('0');
  });

  it('does not include user_id when omitted (partial params)', async () => {
    await client.feedback.list({ limit: 5 });

    const [endpoint] = mockAxiosInstance.get.mock.calls[0];
    expect(endpoint).not.toContain('user_id');
    expect(endpoint).toContain('limit=5');
  });

  it('includes offset=0 when explicitly set (falsy but defined)', async () => {
    await client.feedback.list({ offset: 0 });

    const [endpoint] = mockAxiosInstance.get.mock.calls[0];
    expect(endpoint).toContain('offset=0');
  });

  it('forwards AbortSignal', async () => {
    const controller = new AbortController();

    await client.feedback.list({ user_id: 'u1' }, { signal: controller.signal });

    // axios.get is called as (path, config) — signal lives inside config
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      expect.stringContaining('/feedback'),
      expect.objectContaining({ signal: controller.signal }),
    );
  });
});

// ---------------------------------------------------------------------------
// Type completeness (compile-time checks via runtime assignment)
// ---------------------------------------------------------------------------

describe('Type definitions', () => {
  it('FeedbackSubmitRequest accepts all optional fields', () => {
    const req: FeedbackSubmitRequest = {
      rating: 4,
      item_feedback: [{ memory_id: 'uuid', useful: false, reason: 'off-topic' }],
      expected_missing: 'budget info',
      context: { key: 'value' },
    };
    expect(req.rating).toBe(4);
  });

  it('FeedbackResponse has all required fields', () => {
    const resp: FeedbackResponse = {
      feedback_id: 'fid',
      retrieve_id: 'rid',
      status: 'accepted',
      created_at: '2026-04-08T00:00:00Z',
    };
    expect(resp.status).toBe('accepted');
  });

  it('FeedbackListResponse has feedbacks array and pagination fields', () => {
    const resp: FeedbackListResponse = {
      feedbacks: [],
      total_count: 0,
      limit: 20,
      offset: 0,
    };
    expect(Array.isArray(resp.feedbacks)).toBe(true);
  });
});
