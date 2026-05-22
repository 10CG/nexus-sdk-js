/**
 * @nexusm/sdk - Advanced Configuration Example
 *
 * Demonstrates:
 * - Custom cache and retry settings
 * - Disabling cache/retry
 * - Multi-tenant configuration
 * - Error handling patterns
 * - Knowledge graph operations
 */

import {
  NexusClient,
  ApiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  NetworkError,
  TimeoutError,
} from '@nexusm/sdk';

// ----------------------------------------------------------------
// Custom configuration
// ----------------------------------------------------------------
const nexus = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
  tenantId: 'tenant_acme',
  baseUrl: 'https://nexus.example.com/v1',
  timeout: 15_000,

  // Aggressive caching for read-heavy workloads
  cache: {
    max: 2000,
    ttl: 600, // 10 minutes
  },

  // Conservative retry for latency-sensitive flows
  retry: {
    maxRetries: 2,
    initialDelay: 500,
    maxDelay: 5000,
    backoffFactor: 2,
  },
});

// ----------------------------------------------------------------
// No-cache client for real-time dashboards
// ----------------------------------------------------------------
const realtimeClient = new NexusClient({
  apiKey: process.env.NEXUS_API_KEY!,
  cache: false,
  retry: false,
  timeout: 5_000,
});

// ----------------------------------------------------------------
// Error handling patterns
// ----------------------------------------------------------------
async function robustContextRetrieval(userId: string, query: string) {
  try {
    return await nexus.context.retrieve({
      user_id: userId,
      query,
      layers: ['recent', 'semantic', 'graph'],
    });
  } catch (err) {
    if (err instanceof AuthenticationError) {
      throw new Error('Invalid Nexus API key. Check your configuration.');
    }

    if (err instanceof RateLimitError) {
      const delay = (err.retryAfter ?? 60) * 1000;
      console.warn(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return nexus.context.retrieve({ user_id: userId, query });
    }

    if (err instanceof ValidationError) {
      console.error('Validation errors:', err.details);
      throw err;
    }

    if (err instanceof NetworkError || err instanceof TimeoutError) {
      console.error('Network issue:', err.message);
      return null;
    }

    if (err instanceof ApiError) {
      console.error(`API error ${err.statusCode}: ${err.message}`);
    }

    throw err;
  }
}

// ----------------------------------------------------------------
// Knowledge graph operations
// ----------------------------------------------------------------
async function buildKnowledgeGraph() {
  const extraction = await nexus.knowledge.extract({
    text: 'Alice is the lead engineer at Acme Corp. She manages the Phoenix project with Bob.',
    owner_user_id: 'user_42',
  });

  console.log('Extracted entities:', extraction.entities);
  console.log('Extracted relationships:', extraction.relationships);

  const graph = await nexus.knowledge.query({
    entity_name: 'Alice',
    depth: 2,
  });
  console.log('Graph paths:', graph.paths);

  const entity = await nexus.knowledge.createEntity({
    name: 'Phoenix Project',
    entity_type: 'Project',
    description: 'Internal platform modernization initiative',
    properties: { status: 'active', priority: 'high' },
  });
  console.log('Created entity:', entity);
}

// ----------------------------------------------------------------
// Batch activity ingestion
// ----------------------------------------------------------------
async function reportAgentActivities() {
  const response = await nexus.activities.stream({
    agent_id: 'my-agent-v2',
    activities: [
      { action: 'read_file', activity_data: { path: 'src/main.ts' } },
      { action: 'edit_file', activity_data: { path: 'src/main.ts', lines_changed: 15 } },
      { action: 'run_test', activity_data: { suite: 'integration', passed: true } },
    ],
  });
  console.log(`Accepted: ${response.accepted}, Queued: ${response.queued}`);
}

async function main() {
  await robustContextRetrieval('user_42', 'project status');
  await buildKnowledgeGraph();
  await reportAgentActivities();
}

main().catch(console.error);
