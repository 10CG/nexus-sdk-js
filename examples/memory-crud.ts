/**
 * @nexusm/sdk - Memory CRUD Example
 *
 * Demonstrates the full memory lifecycle:
 * - Create, read, update, delete memories
 * - Semantic search across memories
 * - Memory journal export
 */

import { NexusClient } from '@nexusm/sdk';

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
});

async function main() {
  const userId = 'user_42';

  // ----------------------------------------------------------------
  // Create memories
  // ----------------------------------------------------------------
  const mem1 = await nexus.memories.create({
    user_id: userId,
    content: 'User prefers dark mode and compact layout',
    memory_type: 'semantic',
  });
  console.log('Created memory:', mem1.id);

  const mem2 = await nexus.memories.create({
    user_id: userId,
    content: 'User is working on the Phoenix project with Alice',
    memory_type: 'semantic',
  });
  console.log('Created memory:', mem2.id);

  // ----------------------------------------------------------------
  // Read a single memory
  // ----------------------------------------------------------------
  const fetched = await nexus.memories.get(mem1.id);
  console.log('Fetched memory:', fetched.content);

  // ----------------------------------------------------------------
  // Update a memory
  // ----------------------------------------------------------------
  const updated = await nexus.memories.update(mem1.id, {
    content: 'User prefers dark mode, compact layout, and monospace font',
  });
  console.log('Updated memory:', updated.content);

  // ----------------------------------------------------------------
  // Semantic search
  // ----------------------------------------------------------------
  const results = await nexus.memories.search({
    user_id: userId,
    query: 'UI theme preferences',
  });
  console.log('Search results:', results.map((r) => r.content));

  // ----------------------------------------------------------------
  // Memory journal (markdown export)
  // ----------------------------------------------------------------
  const journal = await nexus.memories.journal({
    user_id: userId,
    format: 'markdown',
  });
  console.log('Journal:\n', journal);

  // ----------------------------------------------------------------
  // Delete a memory
  // ----------------------------------------------------------------
  await nexus.memories.delete(mem2.id);
  console.log('Deleted memory:', mem2.id);
}

main().catch(console.error);
