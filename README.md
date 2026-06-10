# @nexusm/sdk

Official Node.js SDK for the Nexus AI Cognitive Services Platform.

## Features

- **6 Services** -- Context, Memory, Conversation, Knowledge, Activity, Tenant
- **TypeScript-first** -- Full type definitions for all requests and responses
- **LRU Caching** -- Configurable in-memory cache with TTL for read endpoints
- **Auto Retry** -- Exponential back-off with configurable limits
- **Offline Queue** -- Queues requests when the network is unavailable
- **Error Hierarchy** -- Typed error classes mapped to HTTP status codes

## Installation

```bash
npm install @nexusm/sdk
```

## Quick Start

```typescript
import { NexusClient } from '@nexusm/sdk';

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
});

// Aggregated context retrieval (Chat main flow)
const context = await nexus.context.retrieve({
  user_id: 'user_42',
  query: 'What are the user preferences?',
  layers: ['recent', 'semantic', 'graph'],
});

// Semantic memory search
const results = await nexus.memories.search({
  user_id: 'user_42',
  query: 'UI preferences',
});

// Log an activity
await nexus.activities.log({
  action: 'edit_file',
  activity_data: { path: 'src/index.ts', lines_changed: 12 },
});
```

## Configuration

```typescript
const nexus = new NexusClient({
  // Required
  apiKey: 'nx_live_...',

  // Optional (defaults shown)
  baseUrl: 'http://localhost:8001/v1',
  tenantId: 'my-tenant',       // Multi-tenant isolation header
  timeout: 30_000,             // Request timeout in ms

  // Cache -- pass false to disable
  cache: {
    max: 1000,                 // Max LRU entries
    ttl: 300,                  // TTL in seconds (5 min)
  },

  // Retry -- pass false to disable
  retry: {
    maxRetries: 3,             // Retry attempts (excluding initial)
    initialDelay: 1000,        // First retry delay in ms
    maxDelay: 10_000,          // Upper bound for delay in ms
    backoffFactor: 2,          // Multiplier per attempt
  },
});
```

## API Reference

### Context Service

The primary entry point for Chat main flows. Fetches user profile, conversation history, and knowledge graph data in a single call.

```typescript
const ctx = await nexus.context.retrieve({
  user_id: 'user_42',
  query: 'project status',
  layers: ['recent', 'semantic', 'graph'],
});
```

| Method | Description |
|--------|-------------|
| `retrieve(request)` | Aggregated context retrieval across memory, conversation, and knowledge layers |

### Memory Service

Long-term memory management powered by Mem0. Supports CRUD, semantic search, and the Memory Journal view.

```typescript
const memory = await nexus.memories.create({
  user_id: 'user_42',
  content: 'User prefers dark mode',
  memory_type: 'semantic',
});

const results = await nexus.memories.search({
  user_id: 'user_42',
  query: 'UI preferences',
});
```

| Method | Description |
|--------|-------------|
| `create(data)` | Create a new memory record |
| `list(params?)` | List memories with optional filtering and pagination |
| `get(memoryId)` | Retrieve a single memory by ID |
| `update(memoryId, data)` | Partial update of a memory record |
| `delete(memoryId)` | Delete a memory record |
| `search(request)` | Semantic similarity search across memories |
| `journal(params?)` | Chronological Memory Journal view (markdown or JSON) |

### Conversation Service

Conversation history and auto-summary management powered by Zep OSS.

```typescript
const conv = await nexus.conversations.create({
  user_id: 'user_42',
  metadata: { topic: 'project planning' },
});

await nexus.conversations.addMessage(conv.id, {
  role: 'user',
  content: 'Let us discuss the roadmap.',
});

const summary = await nexus.conversations.getSummary(conv.id);
```

| Method | Description |
|--------|-------------|
| `create(data)` | Create a new conversation session |
| `list(params?)` | List conversations with optional filtering |
| `get(conversationId)` | Retrieve a conversation with messages |
| `addMessage(conversationId, message)` | Add a message to a conversation |
| `getMessages(conversationId, params?)` | List messages within a conversation |
| `getSummary(conversationId)` | Get auto-generated conversation summary |
| `delete(conversationId)` | Delete a conversation and all its messages |

### Knowledge Service

Knowledge graph construction and query powered by Fast GraphRAG.

```typescript
const extraction = await nexus.knowledge.extract({
  text: 'Alice works at Acme Corp on the Phoenix project.',
  owner_user_id: 'user_42',
});

const graph = await nexus.knowledge.query({
  entity_name: 'Alice',
  depth: 2,
});
```

| Method | Description |
|--------|-------------|
| `listEntities(params)` | List entities for a user (`user_id` required) |
| `query(request)` | BFS graph traversal from a named entity |
| `extract(request)` | Extract entities and relationships from text (also how entities are created) |

> v3.0.0: `createEntity()` was removed — the backend has no
> `POST /knowledge/entities` route (the SDK method 404'd at runtime).
> Entities are created via `extract()`.

### Activity Service

Activity stream ingestion for passive memory collection.

```typescript
await nexus.activities.log({
  action: 'edit_file',
  activity_data: { path: 'src/app.ts', lines_changed: 42 },
});

await nexus.activities.stream({
  agent_id: 'cursor-agent',
  activities: [
    { action: 'read_file', activity_data: { path: 'README.md' } },
    { action: 'run_test', activity_data: { suite: 'unit', passed: true } },
  ],
});
```

| Method | Description |
|--------|-------------|
| `stream(request)` | Batch-ingest up to 1000 activities |
| `log(activity, agentId?)` | Convenience method to log a single activity |

### Tenant Service

Tenant profile and usage management. Identity is derived from the API key.

```typescript
const tenant = await nexus.tenants.me();
console.log(tenant.name, tenant.tier);

const usage = await nexus.tenants.usage('week');
console.log(`API calls: ${usage.api_calls} (${usage.success_rate}% ok)`);
```

| Method | Description |
|--------|-------------|
| `me()` | Retrieve the current tenant profile (flat counts + `quota_remaining`) |
| `usage(period?)` | Usage statistics for `'day'` (default) / `'week'` / `'month'` — 13-field `UsageStats` |

## Error Handling

All SDK errors extend `NexusError` and carry a machine-readable `code` field.

```
NexusError (base)
  +-- ConfigurationError    -- Invalid SDK options
  +-- NetworkError          -- Connection failures
  +-- TimeoutError          -- Request timeout exceeded
  +-- ApiError              -- HTTP API errors (has statusCode)
        +-- AuthenticationError  -- 401
        +-- ValidationError      -- 400 (has details)
        +-- NotFoundError        -- 404
        +-- RateLimitError       -- 429 (has retryAfter)
```

```typescript
import { ApiError, RateLimitError, NotFoundError } from '@nexusm/sdk';

try {
  await nexus.memories.get('non-existent-id');
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log('Memory not found');
  } else if (err instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${err.retryAfter}s`);
  } else if (err instanceof ApiError) {
    console.log(`API error ${err.statusCode}: ${err.message}`);
  }
}
```

## Caching

The SDK includes an LRU cache that automatically caches responses from read endpoints:

- All `GET` requests (list, get operations)
- Read-oriented `POST` endpoints: `/context/retrieve`, `/memories/search`, `/knowledge/query`

Write operations (`POST`, `PATCH`, `DELETE`) automatically invalidate related cache entries by path prefix, ensuring read-after-write consistency.

```typescript
// Disable caching entirely
const nexus = new NexusClient({
  apiKey: 'nx_live_...',
  cache: false,
});

// Custom cache settings
const nexus2 = new NexusClient({
  apiKey: 'nx_live_...',
  cache: { max: 500, ttl: 120 },
});
```

## Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0 (recommended)

## License

MIT
