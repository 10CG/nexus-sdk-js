import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';

import {
  contextRequestSchema,
  memoryCreateSchema,
  memoryUpdateSchema,
  memorySearchSchema,
  conversationCreateSchema,
  messageCreateSchema,
  entityCreateSchema,
  graphQueryRequestSchema,
  extractionRequestSchema,
  apiKeyCreateSchema,
} from '../../src/schemas';
import { InputValidationError } from '../../src/errors/validation';
import { NexusError } from '../../src/errors/base';

// ---------------------------------------------------------------------------
// contextRequestSchema
// ---------------------------------------------------------------------------

describe('contextRequestSchema', () => {
  it('should accept valid minimal request', () => {
    const result = contextRequestSchema.safeParse({ user_id: 'u1' });
    expect(result.success).toBe(true);
  });

  it('should accept valid full request', () => {
    const result = contextRequestSchema.safeParse({
      user_id: 'u1',
      query: 'hello',
      layers: ['recent', 'semantic', 'graph'],
      recent_hours: 4,
      recent_limit: 10,
      include_profile: true,
      profile_limit: 5,
      include_history: true,
      history_limit: 10,
      include_graph: true,
      graph_limit: 5,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty user_id', () => {
    const result = contextRequestSchema.safeParse({ user_id: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing user_id', () => {
    const result = contextRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject invalid layer value', () => {
    const result = contextRequestSchema.safeParse({ user_id: 'u1', layers: ['invalid'] });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// memoryCreateSchema
// ---------------------------------------------------------------------------

describe('memoryCreateSchema', () => {
  it('should accept valid minimal request', () => {
    const result = memoryCreateSchema.safeParse({ user_id: 'u1', content: 'hello' });
    expect(result.success).toBe(true);
  });

  it('should accept valid full request', () => {
    const result = memoryCreateSchema.safeParse({
      user_id: 'u1',
      content: 'hello',
      memory_type: 'semantic',
      metadata: { key: 'value' },
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty content', () => {
    const result = memoryCreateSchema.safeParse({ user_id: 'u1', content: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid memory_type', () => {
    const result = memoryCreateSchema.safeParse({ user_id: 'u1', content: 'x', memory_type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('should reject content exceeding 10000 chars', () => {
    const result = memoryCreateSchema.safeParse({ user_id: 'u1', content: 'a'.repeat(10001) });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// memoryUpdateSchema
// ---------------------------------------------------------------------------

describe('memoryUpdateSchema', () => {
  it('should accept empty object (all optional)', () => {
    const result = memoryUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('should accept valid partial update', () => {
    const result = memoryUpdateSchema.safeParse({ content: 'updated', memory_type: 'procedural' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid memory_type', () => {
    const result = memoryUpdateSchema.safeParse({ memory_type: 'bad' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// memorySearchSchema
// ---------------------------------------------------------------------------

describe('memorySearchSchema', () => {
  it('should accept valid minimal request', () => {
    const result = memorySearchSchema.safeParse({ user_id: 'u1', query: 'test' });
    expect(result.success).toBe(true);
  });

  it('should reject limit > 50', () => {
    const result = memorySearchSchema.safeParse({ user_id: 'u1', query: 'test', limit: 51 });
    expect(result.success).toBe(false);
  });

  it('should reject threshold > 1', () => {
    const result = memorySearchSchema.safeParse({ user_id: 'u1', query: 'test', threshold: 1.5 });
    expect(result.success).toBe(false);
  });

  it('should reject threshold < 0', () => {
    const result = memorySearchSchema.safeParse({ user_id: 'u1', query: 'test', threshold: -0.1 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// conversationCreateSchema
// ---------------------------------------------------------------------------

describe('conversationCreateSchema', () => {
  it('should accept valid minimal request', () => {
    const result = conversationCreateSchema.safeParse({ user_id: 'u1' });
    expect(result.success).toBe(true);
  });

  it('should accept valid full request', () => {
    const result = conversationCreateSchema.safeParse({
      user_id: 'u1',
      session_id: 'sess1',
      metadata: { topic: 'test' },
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty user_id', () => {
    const result = conversationCreateSchema.safeParse({ user_id: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// messageCreateSchema
// ---------------------------------------------------------------------------

describe('messageCreateSchema', () => {
  it('should accept valid request', () => {
    const result = messageCreateSchema.safeParse({ role: 'user', content: 'hello' });
    expect(result.success).toBe(true);
  });

  it('should accept all valid roles', () => {
    for (const role of ['user', 'assistant', 'system', 'tool']) {
      const result = messageCreateSchema.safeParse({ role, content: 'msg' });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid role', () => {
    const result = messageCreateSchema.safeParse({ role: 'admin', content: 'hello' });
    expect(result.success).toBe(false);
  });

  it('should reject empty content', () => {
    const result = messageCreateSchema.safeParse({ role: 'user', content: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// entityCreateSchema
// ---------------------------------------------------------------------------

describe('entityCreateSchema', () => {
  it('should accept valid minimal request', () => {
    const result = entityCreateSchema.safeParse({ name: 'Alice', entity_type: 'Person' });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = entityCreateSchema.safeParse({ name: '', entity_type: 'Person' });
    expect(result.success).toBe(false);
  });

  it('should reject empty entity_type', () => {
    const result = entityCreateSchema.safeParse({ name: 'Alice', entity_type: '' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// graphQueryRequestSchema
// ---------------------------------------------------------------------------

describe('graphQueryRequestSchema', () => {
  it('should accept valid minimal request', () => {
    const result = graphQueryRequestSchema.safeParse({ entity_name: 'Alice' });
    expect(result.success).toBe(true);
  });

  it('should reject depth > 3', () => {
    const result = graphQueryRequestSchema.safeParse({ entity_name: 'Alice', depth: 4 });
    expect(result.success).toBe(false);
  });

  it('should reject depth < 1', () => {
    const result = graphQueryRequestSchema.safeParse({ entity_name: 'Alice', depth: 0 });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractionRequestSchema
// ---------------------------------------------------------------------------

describe('extractionRequestSchema', () => {
  it('should accept valid request with agent_id', () => {
    const result = extractionRequestSchema.safeParse({ text: 'Alice works at Acme', agent_id: 'a1' });
    expect(result.success).toBe(true);
  });

  it('should accept valid request with owner_user_id', () => {
    const result = extractionRequestSchema.safeParse({ text: 'Alice works at Acme', owner_user_id: 'u1' });
    expect(result.success).toBe(true);
  });

  it('should reject empty text', () => {
    const result = extractionRequestSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });

  it('should reject text exceeding 10000 chars', () => {
    const result = extractionRequestSchema.safeParse({ text: 'a'.repeat(10001) });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// InputValidationError
// ---------------------------------------------------------------------------

describe('InputValidationError', () => {
  it('should be an instance of NexusError', () => {
    const result = memoryCreateSchema.safeParse({ user_id: '', content: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = new InputValidationError(result.error);
      expect(err).toBeInstanceOf(NexusError);
    }
  });

  it('should have code NEXUS_INPUT_VALIDATION_ERROR', () => {
    const result = memoryCreateSchema.safeParse({ user_id: '', content: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = new InputValidationError(result.error);
      expect(err.code).toBe('NEXUS_INPUT_VALIDATION_ERROR');
    }
  });

  it('should have fieldErrors with correct structure', () => {
    const result = memoryCreateSchema.safeParse({ content: 'hello' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = new InputValidationError(result.error);
      expect(err.fieldErrors).toBeDefined();
      expect(err.fieldErrors.user_id).toBeDefined();
      expect(Array.isArray(err.fieldErrors.user_id)).toBe(true);
    }
  });

  it('should include field paths in message', () => {
    const result = contextRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = new InputValidationError(result.error);
      expect(err.message).toContain('Validation failed');
      expect(err.message).toContain('user_id');
    }
  });

  it('should have name InputValidationError', () => {
    const result = memoryCreateSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const err = new InputValidationError(result.error);
      expect(err.name).toBe('InputValidationError');
    }
  });
});

// ---------------------------------------------------------------------------
// apiKeyCreateSchema
// ---------------------------------------------------------------------------

describe('apiKeyCreateSchema', () => {
  it('should accept valid minimal request', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'My Key' });
    expect(result.success).toBe(true);
  });

  it('should accept valid full request', () => {
    const result = apiKeyCreateSchema.safeParse({
      name: 'Production Key',
      scopes: ['read', 'write'],
      expires_days: 90,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = apiKeyCreateSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject name exceeding 100 chars', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'a'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('should reject invalid scope', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'Key', scopes: ['invalid'] });
    expect(result.success).toBe(false);
  });

  it('should reject expires_days < 1', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'Key', expires_days: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject expires_days > 365', () => {
    const result = apiKeyCreateSchema.safeParse({ name: 'Key', expires_days: 366 });
    expect(result.success).toBe(false);
  });
});