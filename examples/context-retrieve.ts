/**
 * @nexusm/sdk - Context Retrieval Example
 *
 * Demonstrates the three-layer aggregated context retrieval:
 * - recent: Recent conversation history
 * - semantic: Semantically similar memories
 * - graph: Knowledge graph traversal results
 */

import { NexusClient } from '@nexusm/sdk';

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
  cache: { max: 1000, ttl: 300 },
});

async function main() {
  // ----------------------------------------------------------------
  // Full three-layer retrieval
  // ----------------------------------------------------------------
  const fullContext = await nexus.context.retrieve({
    user_id: 'user_42',
    query: '用户偏好',
    layers: ['recent', 'semantic', 'graph'],
  });

  console.log('=== Full Context ===');
  console.log('Memories:', fullContext.profile?.memories);
  console.log('Messages:', fullContext.history?.messages);
  console.log('Entities:', fullContext.graph?.entities);

  // ----------------------------------------------------------------
  // Selective layer retrieval (only semantic + graph)
  // ----------------------------------------------------------------
  const partialContext = await nexus.context.retrieve({
    user_id: 'user_42',
    query: 'project dependencies',
    layers: ['semantic', 'graph'],
  });

  console.log('\n=== Partial Context (semantic + graph) ===');
  console.log('Memories:', partialContext.profile?.memories);
  console.log('Entities:', partialContext.graph?.entities);

  // ----------------------------------------------------------------
  // Minimal retrieval (recent history only)
  // ----------------------------------------------------------------
  const recentOnly = await nexus.context.retrieve({
    user_id: 'user_42',
    query: 'latest conversation',
    layers: ['recent'],
  });

  console.log('\n=== Recent Only ===');
  console.log('Messages:', recentOnly.history?.messages);

  // ----------------------------------------------------------------
  // Default retrieval (all layers when omitted)
  // ----------------------------------------------------------------
  const defaultContext = await nexus.context.retrieve({
    user_id: 'user_42',
    query: 'summarize everything about this user',
  });

  console.log('\n=== Default (all layers) ===');
  console.log('Profile:', defaultContext.profile);
  console.log('History:', defaultContext.history);
  console.log('Graph:', defaultContext.graph);
}

main().catch(console.error);
