/**
 * Contract-shape fixtures for v2.0.0 flat-array reconciliation (ADR-003).
 *
 * Locks the canonical wire shape of `ContextRetrieveResponse` and
 * `MemorySearchResult` against the backend `response_model` ground truth
 * (`src/nexus/schemas/context.py::ContextResponse` +
 * `memory.py::MemorySearchResponse`). The fixtures below are typed as the SDK
 * public types — if a future edit regresses `profile`/`history`/`graph` back to
 * nested containers, or drops a top-level field, this file fails to compile.
 *
 * @since 2.0.0 (TASK-004; precondition for the T6 three-way parity gate)
 */
import { describe, it, expect } from 'vitest';
import type {
  ContextRetrieveResponse,
  ProfileMemory,
  ConversationMessage,
  ContextGraphEntity,
} from '../../src/types/context';
import type { MemorySearchResult, SearchResult } from '../../src/types/memory';

// Representative of a real `POST /v1/context/retrieve` response (flat arrays).
const CONTEXT_FIXTURE: ContextRetrieveResponse = {
  retrieve_id: '550e8400-e29b-41d4-a716-446655440000',
  profile: [
    {
      memory_id: 'm-1',
      content: 'User prefers concise answers',
      memory_type: 'semantic',
      category: 'preference',
      similarity_score: 0.91,
      metadata: { source: 'chat' },
    },
  ],
  history: [
    {
      message_id: 'msg-1',
      role: 'user',
      content: 'hello',
      created_at: '2026-06-05T04:00:00Z',
      metadata: {},
    },
  ],
  graph: [
    {
      entity_id: 'e-1',
      name: 'Acme Corp',
      type: 'Organization',
      description: null,
      relationships: [{ target: 'e-2', relation: 'partner' }],
      relevance_score: 0.5,
    },
  ],
  ai_profile: { tone: 'concise' },
  retrieved_at: '2026-06-05T04:00:01Z',
  total_latency_ms: 42,
  errors: null,
  experiment_group: 'treatment',
  temporal_filtered_count: 0,
  as_of: null,
};

const SEARCH_FIXTURE: MemorySearchResult = {
  results: [
    {
      memory_id: 'm-1',
      content: 'User prefers concise answers',
      memory_type: 'semantic',
      similarity: 0.91,
      metadata: {},
    },
  ],
  query: 'preferences',
  total_found: 1,
  search_time_ms: 12.5,
};

describe('v2.0.0 context contract shape (ADR-003)', () => {
  it('profile/history/graph are flat arrays, not nested containers', () => {
    expect(Array.isArray(CONTEXT_FIXTURE.profile)).toBe(true);
    expect(Array.isArray(CONTEXT_FIXTURE.history)).toBe(true);
    expect(Array.isArray(CONTEXT_FIXTURE.graph)).toBe(true);
    // top-level flat fields present (were missing / under `meta` pre-2.0.0)
    expect(typeof CONTEXT_FIXTURE.total_latency_ms).toBe('number');
    expect(typeof CONTEXT_FIXTURE.retrieved_at).toBe('string');
    // `meta` is gone — guard against accidental reintroduction
    expect('meta' in CONTEXT_FIXTURE).toBe(false);
  });

  it('element shapes mirror backend (real element keys)', () => {
    const p: ProfileMemory = CONTEXT_FIXTURE.profile![0];
    const m: ConversationMessage = CONTEXT_FIXTURE.history![0];
    const g: ContextGraphEntity = CONTEXT_FIXTURE.graph![0];
    expect(p.memory_id).toBeDefined();
    expect(p.similarity_score).toBeDefined();
    expect(m.message_id).toBeDefined();
    expect(g.entity_id).toBeDefined();
    expect(g.type).toBeDefined();
  });

  it('memory search result is flat (SearchResult elements, search_time_ms)', () => {
    const r: SearchResult = SEARCH_FIXTURE.results[0];
    expect(r.memory_id).toBeDefined();
    expect(r.similarity).toBeGreaterThanOrEqual(0);
    expect(typeof SEARCH_FIXTURE.search_time_ms).toBe('number');
    expect(typeof SEARCH_FIXTURE.total_found).toBe('number');
    expect('took_ms' in SEARCH_FIXTURE).toBe(false);
  });
});
