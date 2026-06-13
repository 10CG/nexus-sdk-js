/**
 * Contract-shape fixtures for v5.0.0 memlist-convreq reconciliation.
 *
 * Locks the canonical wire shape of `MemoryList` (flat, mirrors backend
 * `MemoryListResponse`) and the `ConversationCreate` request (no phantom
 * `session_id`, has `agent_id`), plus the list-params `user_id`-required
 * change. Typed fixtures fail to COMPILE if a future edit regresses the
 * shape; the `@ts-expect-error` blocks fail to compile if the optionality
 * regresses (a bare-error injection — NOT `as never` — so the lock is real).
 *
 * @since 5.0.0 (memlist-convreq-contract-reconciliation; closes nexus-sdk-js #25)
 */
import { describe, it, expect } from 'vitest';
import type { MemoryList } from '../../src/types/memory';
import type { ConversationCreate } from '../../src/types/conversation';
import type { MemoryListParams } from '../../src/services/memories';
import type { ConversationListParams } from '../../src/services/conversations';

// Representative of a real `GET /memories` response — FLAT container.
const MEMORY_LIST_FIXTURE: MemoryList = {
  memories: [],
  total_count: 0,
  limit: 50,
  offset: 0,
  has_next: false,
};

// Representative `POST /conversations` request — agent_id, no session_id.
const CONV_CREATE_FIXTURE: ConversationCreate = {
  user_id: 'u1',
  agent_id: 'agent_7',
  metadata: { topic: 'planning' },
};

describe('v5.0.0 memlist-convreq contract shape', () => {
  it('MemoryList is a flat container (memories/total_count/has_next), not nested {data,pagination}', () => {
    expect(Array.isArray(MEMORY_LIST_FIXTURE.memories)).toBe(true);
    expect(typeof MEMORY_LIST_FIXTURE.total_count).toBe('number');
    expect(typeof MEMORY_LIST_FIXTURE.has_next).toBe('boolean');
    // guard against accidental reintroduction of the nested phantom
    expect('data' in MEMORY_LIST_FIXTURE).toBe(false);
    expect('pagination' in MEMORY_LIST_FIXTURE).toBe(false);
    expect('has_more' in MEMORY_LIST_FIXTURE).toBe(false);
  });

  it('ConversationCreate has agent_id and no phantom session_id', () => {
    expect(CONV_CREATE_FIXTURE.agent_id).toBe('agent_7');
    expect('session_id' in CONV_CREATE_FIXTURE).toBe(false);
  });

  it('list params require user_id (backend Query(..., min_length=1))', () => {
    const m: MemoryListParams = { user_id: 'u1' };
    const c: ConversationListParams = { user_id: 'u1' };
    expect(m.user_id).toBe('u1');
    expect(c.user_id).toBe('u1');
  });
});

// ---------------------------------------------------------------------------
// Compile-time locks (bare-error injection). These blocks MUST fail to
// type-check; if an edit makes them valid (e.g. user_id back to optional, or
// session_id re-added), `@ts-expect-error` becomes unused → tsc errors.
// ---------------------------------------------------------------------------

// @ts-expect-error — user_id is required on MemoryListParams (v5.0.0)
const _BAD_MEM_PARAMS: MemoryListParams = { limit: 10 };

// @ts-expect-error — user_id is required on ConversationListParams (v5.0.0)
const _BAD_CONV_PARAMS: ConversationListParams = { limit: 10 };

// @ts-expect-error — session_id is no longer a ConversationCreate field (v5.0.0)
const _BAD_CONV_CREATE: ConversationCreate = { user_id: 'u1', session_id: 'sess1' };

// @ts-expect-error — MemoryList no longer has a nested `data` array (v5.0.0)
const _BAD_MEM_LIST: MemoryList = { data: [], pagination: { total: 0 } };

void _BAD_MEM_PARAMS;
void _BAD_CONV_PARAMS;
void _BAD_CONV_CREATE;
void _BAD_MEM_LIST;
