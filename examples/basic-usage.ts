/**
 * @nexus/sdk - Basic Usage Example
 *
 * Demonstrates the core SDK features in under 5 minutes:
 * - Context retrieval (Chat main flow)
 * - Memory CRUD and search
 * - Conversation management
 * - Activity logging
 * - Tenant info
 */

import { NexusClient } from '@nexus/sdk';

// 1. Initialize the client
const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
});

async function main() {
  // ----------------------------------------------------------------
  // Context Retrieval (Chat main flow)
  // ----------------------------------------------------------------
  const context = await nexus.context.retrieve({
    user_id: 'user_42',
    query: 'What are my preferences?',
    layers: ['recent', 'semantic', 'graph'],
  });

  console.log('Profile memories:', context.profile?.memories);
  console.log('Recent history:', context.history?.messages);
  console.log('Graph entities:', context.graph?.entities);

  // ----------------------------------------------------------------
  // Memory CRUD
  // ----------------------------------------------------------------
  const memory = await nexus.memories.create({
    user_id: 'user_42',
    content: 'User prefers dark mode and compact layout',
    memory_type: 'semantic',
  });
  console.log('Created memory:', memory.id);

  // Search memories by semantic similarity
  const searchResults = await nexus.memories.search({
    user_id: 'user_42',
    query: 'UI theme preferences',
  });
  console.log('Search results:', searchResults);

  // View the memory journal
  const journal = await nexus.memories.journal({
    user_id: 'user_42',
    format: 'markdown',
  });
  console.log('Journal:', journal);

  // ----------------------------------------------------------------
  // Conversations
  // ----------------------------------------------------------------
  const conv = await nexus.conversations.create({
    user_id: 'user_42',
    metadata: { topic: 'onboarding' },
  });

  await nexus.conversations.addMessage(conv.id, {
    role: 'user',
    content: 'How do I set up my workspace?',
  });

  await nexus.conversations.addMessage(conv.id, {
    role: 'assistant',
    content: 'I can help you configure your workspace settings.',
  });

  const summary = await nexus.conversations.getSummary(conv.id);
  console.log('Conversation summary:', summary);

  // ----------------------------------------------------------------
  // Activity Logging
  // ----------------------------------------------------------------
  await nexus.activities.log({
    action: 'edit_file',
    activity_data: {
      path: 'src/components/Dashboard.tsx',
      lines_changed: 25,
    },
  });

  // ----------------------------------------------------------------
  // Tenant Info
  // ----------------------------------------------------------------
  const tenant = await nexus.tenants.me();
  console.log(`Tenant: ${tenant.name} (${tenant.tier})`);

  const usage = await nexus.tenants.usage();
  console.log('Usage:', usage);
}

main().catch(console.error);
