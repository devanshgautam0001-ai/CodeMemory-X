import { describe, it, expect, beforeEach } from 'vitest';
import { SystemHealthAggregator } from '../health/SystemHealthAggregator.js';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';

describe('TASK-058 Production System Health & Observability Test Suite', () => {
  let mockEventStore: any;
  let mockProvider: any;
  let mockToolRegistry: any;
  let mockToolAuditor: any;
  let mockMemoryEngine: any;
  let mockStoryEngine: any;

  beforeEach(() => {
    mockEventStore = {
      dbPath: '/Users/devan/workspace/.codememory/events.db',
      getEvents: async () => ({ isSuccess: true, value: [{ id: 'evt1' }] }),
    };

    mockProvider = {
      id: 'ollama',
      defaultModel: 'llama3',
    };

    mockToolRegistry = {
      list: () => [{ name: 'search_memories' }, { name: 'get_story' }],
    };

    mockToolAuditor = {
      getAnalytics: async () => ({
        totalCount: 10,
        failureCount: 1,
        avgDurationMs: 45,
      }),
    };

    mockMemoryEngine = { isInitialized: true };
    mockStoryEngine = { isInitialized: true };
  });

  // 1. EventStore Health — HEALTHY state
  it('1. evaluates EventStore as HEALTHY when initialized and responsive', async () => {
    const aggregator = new SystemHealthAggregator({ eventStore: mockEventStore });
    const snapshot = await aggregator.getSnapshot();
    const esComp = snapshot.components.find((c) => c.componentId === 'event_store');

    expect(esComp?.status).toBe('HEALTHY');
    expect(esComp?.isCritical).toBe(true);
    expect(esComp?.metrics?.dbName).toBe('events.db'); // Basename only!
  });

  // 2. EventStore Health — UNAVAILABLE state
  it('2. evaluates EventStore as UNAVAILABLE when missing or uninstantiated', async () => {
    const aggregator = new SystemHealthAggregator({});
    const snapshot = await aggregator.getSnapshot();
    const esComp = snapshot.components.find((c) => c.componentId === 'event_store');

    expect(esComp?.status).toBe('UNAVAILABLE');
    expect(snapshot.overallStatus).toBe('UNAVAILABLE');
  });

  // 3. AI Provider Health — HEALTHY state
  it('3. evaluates AI Provider as HEALTHY without making network calls', async () => {
    const aggregator = new SystemHealthAggregator({ provider: mockProvider });
    const snapshot = await aggregator.getSnapshot();
    const provComp = snapshot.components.find((c) => c.componentId === 'ai_provider');

    expect(provComp?.status).toBe('HEALTHY');
    expect(provComp?.metrics?.providerId).toBe('ollama');
    expect(provComp?.metrics?.model).toBe('llama3');
  });

  // 4. AI Provider Health — UNKNOWN state when missing
  it('4. evaluates AI Provider as UNKNOWN when no provider configured', async () => {
    const aggregator = new SystemHealthAggregator({});
    const snapshot = await aggregator.getSnapshot();
    const provComp = snapshot.components.find((c) => c.componentId === 'ai_provider');

    expect(provComp?.status).toBe('UNKNOWN');
  });

  // 5. Tool Runtime Health
  it('5. evaluates Tool Runtime health from ToolRegistry and ToolAuditor', async () => {
    const aggregator = new SystemHealthAggregator({
      toolRegistry: mockToolRegistry,
      toolAuditor: mockToolAuditor,
    });
    const snapshot = await aggregator.getSnapshot();
    const trComp = snapshot.components.find((c) => c.componentId === 'tool_runtime');

    expect(trComp?.status).toBe('HEALTHY');
    expect(trComp?.metrics?.registeredToolsCount).toBe(2);
    expect(trComp?.eventCount).toBe(10);
    expect(trComp?.errorCount).toBe(1);
  });

  // 6. RPC Bridge Health
  it('6. evaluates RPC Bridge health from rpcMetricsProvider', async () => {
    const rpcMetricsProvider = () => ({
      requestsReceived: 100,
      successfulResponses: 98,
      failedResponses: 2,
      activeRequests: 0,
      lastRequestTimestamp: '2026-08-12T09:00:00Z',
    });

    const aggregator = new SystemHealthAggregator({ rpcMetricsProvider });
    const snapshot = await aggregator.getSnapshot();
    const rpcComp = snapshot.components.find((c) => c.componentId === 'rpc_bridge');

    expect(rpcComp?.status).toBe('HEALTHY');
    expect(rpcComp?.eventCount).toBe(100);
    expect(rpcComp?.errorCount).toBe(2);
  });

  // 7. Cognitive Engines UNKNOWN fallback
  it('7. evaluates cognitive engines as UNKNOWN when no health evidence exists', async () => {
    const aggregator = new SystemHealthAggregator({});
    const snapshot = await aggregator.getSnapshot();

    const memComp = snapshot.components.find((c) => c.componentId === 'memory_engine');
    const driftComp = snapshot.components.find((c) => c.componentId === 'drift_sentinel');

    expect(memComp?.status).toBe('UNKNOWN');
    expect(driftComp?.status).toBe('UNKNOWN');
  });

  // 8. Cognitive Engines HEALTHY when present
  it('8. evaluates cognitive engines as HEALTHY when instantiated', async () => {
    const aggregator = new SystemHealthAggregator({
      memoryEngine: mockMemoryEngine,
      storyEngine: mockStoryEngine,
    });
    const snapshot = await aggregator.getSnapshot();

    const memComp = snapshot.components.find((c) => c.componentId === 'memory_engine');
    const storyComp = snapshot.components.find((c) => c.componentId === 'story_engine');

    expect(memComp?.status).toBe('HEALTHY');
    expect(storyComp?.status).toBe('HEALTHY');
  });

  // 9. Overall System Status — HEALTHY
  it('9. determines overallStatus as HEALTHY when all critical components pass', async () => {
    const aggregator = new SystemHealthAggregator({
      eventStore: mockEventStore,
      provider: mockProvider,
      toolRegistry: mockToolRegistry,
      toolAuditor: mockToolAuditor,
    });
    const snapshot = await aggregator.getSnapshot();

    expect(snapshot.overallStatus).toBe('HEALTHY');
    expect(snapshot.summary.totalComponents).toBe(13);
  });

  // 10. Overall System Status — UNAVAILABLE when critical component fails
  it('10. determines overallStatus as UNAVAILABLE when a critical component fails', async () => {
    const brokenEventStore = {
      dbPath: '/path/events.db',
      getEvents: async () => { throw new Error('Database locked'); },
    };

    const aggregator = new SystemHealthAggregator({
      eventStore: brokenEventStore,
      provider: mockProvider,
    });
    const snapshot = await aggregator.getSnapshot();

    expect(snapshot.overallStatus).toBe('UNAVAILABLE');
    expect(snapshot.summary.unavailableCount).toBe(1);
  });

  // 11. Security boundary — zero secret exposure
  it('11. guarantees SystemHealthSnapshot contains zero API keys, tokens, or prompts', async () => {
    const aggregator = new SystemHealthAggregator({
      eventStore: mockEventStore,
      provider: mockProvider,
      toolRegistry: mockToolRegistry,
      toolAuditor: mockToolAuditor,
    });
    const snapshot = await aggregator.getSnapshot();
    const str = JSON.stringify(snapshot);

    expect(str).not.toContain('apiKey');
    expect(str).not.toContain('bearer');
    expect(str).not.toContain('prompt');
    expect(str).not.toContain('rawArgs');
    expect(str).not.toContain('toolResults');
    expect(str).not.toContain('/Users/devan/workspace/.codememory/events.db'); // Absolute path redacted
  });

  // 12. AIAssistantEngine facade integration
  it('12. AIAssistantEngine.getSystemHealth returns valid snapshot', async () => {
    const engine = new AIAssistantEngine({
      provider: mockProvider,
      eventStore: mockEventStore,
      toolRegistry: mockToolRegistry,
    });

    const snapshot = await engine.getSystemHealth();
    expect(snapshot.overallStatus).toBe('HEALTHY');
    expect(snapshot.components.length).toBeGreaterThan(0);
  });

  // 13. Summary count calculation integrity
  it('13. calculates summary component counts accurately', async () => {
    const aggregator = new SystemHealthAggregator({
      eventStore: mockEventStore,
      provider: mockProvider,
      memoryEngine: mockMemoryEngine,
    });
    const snapshot = await aggregator.getSnapshot();

    const sum = snapshot.summary;
    expect(sum.totalComponents).toBe(snapshot.components.length);
    expect(sum.healthyCount + sum.degradedCount + sum.unavailableCount + sum.unknownCount).toBe(sum.totalComponents);
  });

  // 14. Generated timestamp format
  it('14. produces valid ISO timestamp in generatedAt field', async () => {
    const aggregator = new SystemHealthAggregator({});
    const snapshot = await aggregator.getSnapshot();

    expect(Date.parse(snapshot.generatedAt)).not.toBeNaN();
  });

  // 15. Empty dependencies safe fallback
  it('15. handles completely empty dependencies object gracefully', async () => {
    const aggregator = new SystemHealthAggregator({});
    const snapshot = await aggregator.getSnapshot();

    expect(snapshot.overallStatus).toBe('UNAVAILABLE'); // Critical EventStore unavailable
    expect(snapshot.components.length).toBe(13);
  });
});
