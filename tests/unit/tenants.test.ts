/**
 * Tests for TenantService API Key CRUD methods.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('TenantService', () => {
  let client: NexusClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createClient();
  });

  describe('listApiKeys', () => {
    it('should GET /tenants/me/api-keys', async () => {
      const mockKeys = [
        { id: 'k1', key_prefix: 'nx_live_abc', name: 'Key 1', scopes: ['read'], created_at: '2026-01-01' },
      ];
      mockAxiosInstance.get.mockResolvedValue(axiosResponse(mockKeys));

      const result = await client.tenants.listApiKeys();

      expect(result).toEqual(mockKeys);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/tenants/me/api-keys',
        expect.objectContaining({ params: undefined }),
      );
    });

    it('should forward AbortSignal', async () => {
      mockAxiosInstance.get.mockResolvedValue(axiosResponse([]));
      const controller = new AbortController();

      await client.tenants.listApiKeys({ signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/tenants/me/api-keys',
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe('createApiKey', () => {
    it('should POST /tenants/me/api-keys', async () => {
      const mockCreated = {
        id: 'k2', key_prefix: 'nx_live_xyz', key: 'nx_live_xyz_full',
        name: 'New Key', scopes: ['read', 'write'], created_at: '2026-01-01',
      };
      mockAxiosInstance.post.mockResolvedValue(axiosResponse(mockCreated));

      const result = await client.tenants.createApiKey({ name: 'New Key' });

      expect(result).toEqual(mockCreated);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/tenants/me/api-keys',
        { name: 'New Key' },
        expect.objectContaining({}),
      );
    });

    it('should forward AbortSignal', async () => {
      mockAxiosInstance.post.mockResolvedValue(axiosResponse({}));
      const controller = new AbortController();

      await client.tenants.createApiKey({ name: 'Key' }, { signal: controller.signal });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/tenants/me/api-keys',
        { name: 'Key' },
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });

  describe('revokeApiKey', () => {
    it('should DELETE /tenants/me/api-keys/:id', async () => {
      mockAxiosInstance.delete.mockResolvedValue(axiosResponse(undefined));

      await client.tenants.revokeApiKey('k1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/tenants/me/api-keys/k1',
        expect.objectContaining({}),
      );
    });

    it('should forward AbortSignal', async () => {
      mockAxiosInstance.delete.mockResolvedValue(axiosResponse(undefined));
      const controller = new AbortController();

      await client.tenants.revokeApiKey('k1', { signal: controller.signal });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        '/tenants/me/api-keys/k1',
        expect.objectContaining({ signal: controller.signal }),
      );
    });
  });
});
