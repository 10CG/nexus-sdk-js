/**
 * @nexusm/sdk - Activity Stream Example
 *
 * Demonstrates activity logging and batch ingestion:
 * - Single activity logging
 * - Batch stream ingestion
 * - Agent activity reporting pattern
 */

import { NexusClient } from '@nexusm/sdk';

const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
});

async function main() {
  // ----------------------------------------------------------------
  // Single activity logging
  // ----------------------------------------------------------------
  await nexus.activities.log({
    action: 'edit_file',
    activity_data: {
      path: 'src/components/Dashboard.tsx',
      lines_changed: 25,
    },
  });
  console.log('Logged single activity');

  // ----------------------------------------------------------------
  // Batch stream ingestion
  // ----------------------------------------------------------------
  const response = await nexus.activities.stream({
    agent_id: 'coding-agent-v1',
    activities: [
      {
        action: 'read_file',
        activity_data: { path: 'src/main.ts' },
      },
      {
        action: 'edit_file',
        activity_data: { path: 'src/main.ts', lines_changed: 15 },
      },
      {
        action: 'run_test',
        activity_data: { suite: 'unit', passed: true, duration_ms: 3200 },
      },
      {
        action: 'git_commit',
        activity_data: { message: 'fix: resolve null pointer', files: 3 },
      },
    ],
  });

  console.log(`Accepted: ${response.accepted}`);
  console.log(`Queued: ${response.queued}`);

  // ----------------------------------------------------------------
  // Periodic agent heartbeat pattern
  // ----------------------------------------------------------------
  async function reportHeartbeat(agentId: string) {
    await nexus.activities.log({
      action: 'heartbeat',
      activity_data: {
        agent_id: agentId,
        status: 'active',
        uptime_seconds: process.uptime(),
      },
    });
  }

  // Report heartbeat once for demonstration
  await reportHeartbeat('coding-agent-v1');
  console.log('Heartbeat reported');
}

main().catch(console.error);
