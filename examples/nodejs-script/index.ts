/**
 * Node.js example script
 *
 * Run with: node examples/nodejs-script/index.js
 * Note: Use `node --loader tsx` or compile first with `npm run build`
 */

import { NexusClient } from '../../src/index';

async function main() {
  // Initialize the client
  const client = new NexusClient({
    apiKey: process.env.NEXUS_API_KEY || 'nx_test_demo_key',
    baseURL: process.env.NEXUS_API_URL || 'https://api.nexus.10cg.pub/v1',
  });

  console.log('🚀 Nexus SDK Node.js Example\n');

  try {
    // 1. Get tenant info
    console.log('📋 Getting tenant info...');
    const tenant = await client.getTenant();
    console.log(`  Tenant: ${tenant.name}`);
    console.log(`  Quota: ${tenant.quota_used}/${tenant.quota_limit}`);
    console.log('');

    // 2. Create a memory
    console.log('🧠 Creating a memory...');
    const memory = await client.memories.create({
      content: 'User prefers dark mode in their applications',
      user_id: 'user_example_123',
      memory_type: 'semantic',
    });
    console.log(`  Created memory: ${memory.id}`);
    console.log(`  Content: ${memory.content}`);
    console.log('');

    // 3. Search memories
    console.log('🔍 Searching memories...');
    const results = await client.memories.search({
      query: 'preferences',
      user_id: 'user_example_123',
      limit: 5,
    });
    console.log(`  Found ${results.length} memories`);
    results.forEach((m, i) => {
      console.log(`    ${i + 1}. ${m.content} (score: ${m.score?.toFixed(2)})`);
    });
    console.log('');

    // 4. Create a conversation
    console.log('💬 Creating a conversation...');
    const conversation = await client.conversations.create({
      user_id: 'user_example_123',
      session_id: 'session_example_456',
    });
    console.log(`  Created conversation: ${conversation.id}`);
    console.log('');

    // 5. Add messages
    console.log('📨 Adding messages...');
    await client.conversations.addMessage(conversation.id, {
      role: 'user',
      content: 'Hello, I need help with my project',
    });
    const assistantMessage = await client.conversations.addMessage(conversation.id, {
      role: 'assistant',
      content: 'Hello! How can I help you today?',
    });
    console.log(`  Added message: ${assistantMessage.id}`);
    console.log('');

    // 6. Retrieve aggregated context
    console.log('🔄 Retrieving aggregated context...');
    const context = await client.context.retrieve({
      user_id: 'user_example_123',
      query: 'User preferences and recent conversation',
      options: {
        memory_limit: 5,
        history_limit: 5,
        include_graph: true,
      },
    });
    console.log(`  Profile memories: ${context.profile?.memories.length || 0}`);
    console.log(`  History messages: ${context.history?.messages.length || 0}`);
    console.log(`  Graph entities: ${context.graph?.entities.length || 0}`);
    console.log(`  Retrieval time: ${context.meta?.retrieval_time_ms}ms`);
    console.log('');

    // 7. Knowledge extraction
    console.log('🕸️  Extracting knowledge...');
    const knowledge = await client.knowledge.extract({
      text: '张三是李四的上司，他们在北京工作，都在科技公司任职',
      owner_id: 'user_example_123',
    });
    console.log(`  Entities: ${knowledge.entities.length}`);
    knowledge.entities.forEach((e) => {
      console.log(`    - ${e.name} (${e.entity_type})`);
    });
    console.log(`  Relationships: ${knowledge.relationships.length}`);
    knowledge.relationships.forEach((r) => {
      console.log(`    - ${r.source} -> ${r.relation_type} -> ${r.target}`);
    });
    console.log('');

    console.log('✅ Example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);

    // Error handling example
    if (error instanceof Error) {
      if ('status' in error) {
        console.error(`   Status: ${(error as any).status}`);
        console.error(`   Code: ${(error as any).code}`);
      }
      console.error(`   Message: ${error.message}`);
    }
  }
}

// Run the example
main().catch(console.error);
