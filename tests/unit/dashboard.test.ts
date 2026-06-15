/**
 * Tests for DashboardService.
 *
 * Verifies:
 * 1. export() calls GET /dashboard/export with the correct query params.
 * 2. export() passes only the `dataset` param when optional fields are omitted.
 * 3. export() passes `format` when provided.
 * 4. export() passes `target_tenant_id` when provided.
 * 5. export() passes all three params when all are provided.
 * 6. export() returns the raw string response body (not parsed JSON).
 * 7. export() does NOT cache — repeated calls always hit the network
 *    (responseType: 'text' bypasses the cache layer; test via call count).
 * 8. AbortSignal is forwarded.
 * 9. Type definitions: DashboardExportDataset, DashboardExportParams.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock axios (same pattern as feedback.test.ts)
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
  DashboardExportDataset,
  DashboardExportParams,
} from '../../src/types/dashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function axiosTextResponse(data: string) {
  return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
}

function createClient(): NexusClient {
  return new NexusClient({ apiKey: 'nx_test_key', cache: false, retry: false });
}

const MOCK_CSV = 'bucket,count\n0-1,12\n1-2,45\n2-3,88\n';
const MOCK_JSON_TEXT = '[{"bucket":"0-1","count":12}]';

// ---------------------------------------------------------------------------
// DashboardService.export()
// ---------------------------------------------------------------------------

describe('DashboardService.export()', () => {
  let client: NexusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
    mockAxiosInstance.get.mockResolvedValue(axiosTextResponse(MOCK_CSV));
  });

  it('calls GET /dashboard/export with the dataset param', async () => {
    await client.dashboard.export({ dataset: 'quality_distribution' });

    expect(mockAxiosInstance.get).toHaveBeenCalledOnce();
    const [path, config] = mockAxiosInstance.get.mock.calls[0];
    expect(path).toBe('/dashboard/export');
    expect(config.params).toMatchObject({ dataset: 'quality_distribution' });
  });

  it('omits format and target_tenant_id when not provided', async () => {
    await client.dashboard.export({ dataset: 'feedback_trend' });

    const [, config] = mockAxiosInstance.get.mock.calls[0];
    expect(config.params).toEqual({ dataset: 'feedback_trend' });
    expect(config.params).not.toHaveProperty('format');
    expect(config.params).not.toHaveProperty('target_tenant_id');
  });

  it('passes format=csv when explicitly set', async () => {
    await client.dashboard.export({ dataset: 'diagnosis_stats', format: 'csv' });

    const [, config] = mockAxiosInstance.get.mock.calls[0];
    expect(config.params).toEqual({ dataset: 'diagnosis_stats', format: 'csv' });
  });

  it('passes format=json when set to json', async () => {
    mockAxiosInstance.get.mockResolvedValue(axiosTextResponse(MOCK_JSON_TEXT));
    await client.dashboard.export({ dataset: 'feedback_health', format: 'json' });

    const [, config] = mockAxiosInstance.get.mock.calls[0];
    expect(config.params).toEqual({ dataset: 'feedback_health', format: 'json' });
  });

  it('passes target_tenant_id when provided', async () => {
    await client.dashboard.export({
      dataset: 'error_heatmap',
      target_tenant_id: 'tenant-abc',
    });

    const [, config] = mockAxiosInstance.get.mock.calls[0];
    expect(config.params).toMatchObject({ target_tenant_id: 'tenant-abc' });
  });

  it('passes all three params when all are provided', async () => {
    await client.dashboard.export({
      dataset: 'ab_distribution',
      format: 'json',
      target_tenant_id: 'tenant-xyz',
    });

    const [path, config] = mockAxiosInstance.get.mock.calls[0];
    expect(path).toBe('/dashboard/export');
    expect(config.params).toEqual({
      dataset: 'ab_distribution',
      format: 'json',
      target_tenant_id: 'tenant-xyz',
    });
  });

  it('returns the raw string response body', async () => {
    const result = await client.dashboard.export({ dataset: 'quality_distribution' });
    expect(result).toBe(MOCK_CSV);
    expect(typeof result).toBe('string');
  });

  it('returns raw JSON text (not parsed) when format=json', async () => {
    mockAxiosInstance.get.mockResolvedValue(axiosTextResponse(MOCK_JSON_TEXT));

    const result = await client.dashboard.export({
      dataset: 'feedback_health',
      format: 'json',
    });

    // Must be a string, not a parsed object
    expect(typeof result).toBe('string');
    expect(result).toBe(MOCK_JSON_TEXT);
  });

  it('uses responseType: text to request raw body', async () => {
    await client.dashboard.export({ dataset: 'quality_distribution' });

    const [, config] = mockAxiosInstance.get.mock.calls[0];
    expect(config.responseType).toBe('text');
  });

  it('bypasses the cache even when caching is enabled (getText)', async () => {
    // A cache:true client: get() would serve the 2nd identical call from cache,
    // but export() uses getText() which must always hit the network. Two identical
    // exports → two axios.get calls proves the cache-bypass (non-vacuous; a cache:false
    // client could not distinguish bypass from a disabled cache).
    const cachedClient = new NexusClient({ apiKey: 'nx_test_key', cache: {}, retry: false });
    mockAxiosInstance.get.mockResolvedValue(axiosTextResponse(MOCK_CSV));

    await cachedClient.dashboard.export({ dataset: 'quality_distribution' });
    await cachedClient.dashboard.export({ dataset: 'quality_distribution' });

    expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
  });

  it('forwards AbortSignal', async () => {
    const controller = new AbortController();

    await client.dashboard.export(
      { dataset: 'feedback_trend' },
      { signal: controller.signal },
    );

    const [, config] = mockAxiosInstance.get.mock.calls[0];
    expect(config.signal).toBe(controller.signal);
  });

  it('accepts all six whitelisted dataset values', async () => {
    const datasets: DashboardExportDataset[] = [
      'quality_distribution',
      'feedback_trend',
      'diagnosis_stats',
      'feedback_health',
      'error_heatmap',
      'ab_distribution',
    ];

    for (const dataset of datasets) {
      vi.clearAllMocks();
      mockAxiosInstance.get.mockResolvedValue(axiosTextResponse(MOCK_CSV));

      await client.dashboard.export({ dataset });

      const [, config] = mockAxiosInstance.get.mock.calls[0];
      expect(config.params.dataset).toBe(dataset);
    }
  });
});

// ---------------------------------------------------------------------------
// Type completeness (compile-time checks via runtime assignment)
// ---------------------------------------------------------------------------

describe('Dashboard type definitions', () => {
  it('DashboardExportParams accepts minimal shape (dataset only)', () => {
    const params: DashboardExportParams = { dataset: 'quality_distribution' };
    expect(params.dataset).toBe('quality_distribution');
  });

  it('DashboardExportParams accepts all optional fields', () => {
    const params: DashboardExportParams = {
      dataset: 'ab_distribution',
      format: 'json',
      target_tenant_id: 'tenant-abc',
    };
    expect(params.format).toBe('json');
    expect(params.target_tenant_id).toBe('tenant-abc');
  });

  it('DashboardExportDataset covers all six dataset values', () => {
    // Type-level check: all six must be assignable to DashboardExportDataset.
    const values: DashboardExportDataset[] = [
      'quality_distribution',
      'feedback_trend',
      'diagnosis_stats',
      'feedback_health',
      'error_heatmap',
      'ab_distribution',
    ];
    expect(values).toHaveLength(6);
  });
});
