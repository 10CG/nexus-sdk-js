/**
 * @module tests/unit/client
 * @description Unit tests for NexusClient construction and service wiring.
 */

import { describe, it, expect } from 'vitest';

import { NexusClient } from '../../src/client';
import { ContextService } from '../../src/services/context';
import { MemoryService } from '../../src/services/memories';
import { ConversationService } from '../../src/services/conversations';
import { KnowledgeService } from '../../src/services/knowledge';
import { ActivityService } from '../../src/services/activities';
import { TenantService } from '../../src/services/tenants';

// ---------------------------------------------------------------------------
// NexusClient constructor
// ---------------------------------------------------------------------------

describe('NexusClient', () => {
  it('should create all 6 service properties', () => {
    const client = new NexusClient({ apiKey: 'nx_test_key' });

    expect(client.context).toBeDefined();
    expect(client.memories).toBeDefined();
    expect(client.conversations).toBeDefined();
    expect(client.knowledge).toBeDefined();
    expect(client.activities).toBeDefined();
    expect(client.tenants).toBeDefined();
  });

  it('should create context as an instance of ContextService', () => {
    const client = new NexusClient({ apiKey: 'nx_test_key' });
    expect(client.context).toBeInstanceOf(ContextService);
  });

  it('should create memories as an instance of MemoryService', () => {
    const client = new NexusClient({ apiKey: 'nx_test_key' });
    expect(client.memories).toBeInstanceOf(MemoryService);
  });

  it('should create conversations as an instance of ConversationService', () => {
    const client = new NexusClient({ apiKey: 'nx_test_key' });
    expect(client.conversations).toBeInstanceOf(ConversationService);
  });

  it('should create knowledge as an instance of KnowledgeService', () => {
    const client = new NexusClient({ apiKey: 'nx_test_key' });
    expect(client.knowledge).toBeInstanceOf(KnowledgeService);
  });

  it('should create activities as an instance of ActivityService', () => {
    const client = new NexusClient({ apiKey: 'nx_test_key' });
    expect(client.activities).toBeInstanceOf(ActivityService);
  });

  it('should create tenants as an instance of TenantService', () => {
    const client = new NexusClient({ apiKey: 'nx_test_key' });
    expect(client.tenants).toBeInstanceOf(TenantService);
  });

  it('should throw an error when apiKey is missing', () => {
    // @ts-expect-error -- intentionally passing invalid config for testing
    expect(() => new NexusClient({})).toThrow('apiKey');
  });

  it('should throw an error when apiKey is empty string', () => {
    expect(() => new NexusClient({ apiKey: '' })).toThrow('apiKey');
  });
});
