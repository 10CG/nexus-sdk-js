# @nexus/sdk

> Nexus AI Cognitive Services JavaScript SDK

[![npm version](https://badge.fury.io/js/%40nexus%2Fsdk.svg)](https://www.npmjs.com/package/@nexus/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript/JavaScript SDK for [Nexus AI Cognitive Services Platform](https://forgejo.10cg.pub/10CG/nexus).

## Features

- 🧠 **Memory Service** - Long-term memory with semantic search
- 💬 **Conversation Service** - Chat history with auto-summary
- 🔄 **Context Service** - Aggregated context retrieval (Chat main flow)
- 🕸️ **Knowledge Service** - Knowledge graph construction and query
- 🎯 **Type-safe** - Full TypeScript support with 100% type coverage
- 🌐 **Universal** - Works in browser and Node.js 18+
- 📦 **Zero deps** - No runtime dependencies, uses native fetch

## Installation

```bash
npm install @nexus/sdk
```

## Quick Start

```typescript
import { NexusClient } from '@nexus/sdk';

const client = new NexusClient({
  apiKey: 'nx_live_your_api_key_here',
  baseURL: 'https://api.nexus.10cg.pub/v1'
});

// Create a memory
const memory = await client.memories.create({
  content: 'User prefers dark mode',
  user_id: 'user_123'
});

// Search memories
const results = await client.memories.search({
  query: 'preferences',
  user_id: 'user_123',
  limit: 5
});

// Retrieve aggregated context (Chat main flow)
const context = await client.context.retrieve({
  user_id: 'user_123',
  query: 'User work habits and preferences',
  options: {
    memory_limit: 10,
    history_limit: 5
  }
});
```

## Services

### Memory Service

Manage user memories with semantic search.

```typescript
// Create a memory
const memory = await client.memories.create({
  content: 'User likes blue',
  user_id: 'user_123',
  memory_type: 'semantic'
});

// Search memories
const results = await client.memories.search({
  query: 'color preferences',
  user_id: 'user_123',
  threshold: 0.7
});

// Get a memory
const memory = await client.memories.get('memory_id');

// Delete a memory
await client.memories.delete('memory_id');
```

### Conversation Service

Manage chat conversations and messages.

```typescript
// Create a conversation
const conversation = await client.conversations.create({
  user_id: 'user_123',
  session_id: 'session_abc'
});

// Add a message
const message = await client.conversations.addMessage(conversation.id, {
  role: 'user',
  content: 'Hello!'
});

// Get messages
const messages = await client.conversations.getMessages(conversation.id);

// Get summary
const summary = await client.conversations.getSummary(conversation.id);
```

### Context Service (Main Chat Flow)

Retrieve aggregated context in a single call.

```typescript
const context = await client.context.retrieve({
  user_id: 'user_123',
  query: 'What are the user preferences?',
  options: {
    memory_limit: 10,
    history_limit: 5,
    include_graph: true
  }
});

// Access aggregated data
console.log(context.profile?.memories);   // User memories
console.log(context.history?.messages);   // Conversation history
console.log(context.graph?.entities);    // Knowledge graph entities
```

### Knowledge Service

Knowledge graph extraction and query.

```typescript
// Extract entities and relationships
const result = await client.knowledge.extract({
  text: '张三是李四的上司',
  owner_id: 'user_123'
});

console.log(result.entities);        // 张三, 李四
console.log(result.relationships);  // 张三 -> 上司 -> 李四

// Query knowledge graph
const answer = await client.knowledge.query({
  query: '谁是我的上司？',
  user_id: 'user_123'
});

console.log(answer.answer);  // "张三是您的上司"
```

## Error Handling

```typescript
import {
  NexusError,
  ValidationError,
  AuthenticationError,
  QuotaExceededError,
  NotFoundError
} from '@nexus/sdk';

try {
  await client.memories.create({ ... });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.message, error.details);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof QuotaExceededError) {
    console.log('Quota exceeded:', error.details);
  } else if (error instanceof NexusError) {
    console.log(`Error: ${error.code} - ${error.message}`);
  }
}
```

## Configuration

```typescript
const client = new NexusClient({
  apiKey: 'nx_live_...',     // Required: API key
  baseURL: '...',             // Optional: API base URL
  timeout: 30000,             // Optional: Request timeout (ms)
  maxRetries: 3               // Optional: Max retry attempts
});
```

## Examples

- [Node.js Script](./examples/nodejs-script/) - Example CLI usage

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| Node.js | 18+ |

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test

# Watch mode
npm run dev

# Type check
npm run typecheck
```

## License

MIT © 10CG Team

## Links

- [Documentation](https://nexus.10cg.pub)
- [API Reference](https://nexus.10cg.pub/docs)
- [Repository](https://forgejo.10cg.pub/10CG/nexus-sdk-js)
- [Issue Tracker](https://forgejo.10cg.pub/10CG/nexus-sdk-js/issues)
