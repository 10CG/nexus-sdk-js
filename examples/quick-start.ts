/**
 * @nexus/sdk - Quick Start Example
 *
 * The minimal example to get started with Nexus SDK.
 * Initialize the client and retrieve aggregated context in 5 lines.
 */

import { NexusClient } from '@nexus/sdk';

// Initialize with API key (the only required option)
const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
});

async function main() {
  // One-call aggregated context retrieval (Chat main flow)
  const context = await nexus.context.retrieve({
    user_id: 'user_42',
    query: 'What tasks am I working on?',
  });

  // The response contains all context layers in a single object
  console.log('Profile:', context.profile);
  console.log('History:', context.history);
  console.log('Graph:', context.graph);
}

main().catch(console.error);
