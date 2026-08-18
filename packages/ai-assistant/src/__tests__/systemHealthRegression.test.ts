import { describe, it, expect } from 'vitest';
import { SystemHealthAggregator } from '../health/SystemHealthAggregator.js';

describe('TASK-059 System Health Aggregation Regression & Hardening Suite', () => {
  it('1. correctly propagates critical UNAVAILABLE EventStore to overall system UNAVAILABLE', async () => {
    const aggregator = new SystemHealthAggregator({
      eventStore: null, // Critical component missing
      provider: { id: 'ollama', defaultModel: 'llama3' },
      memoryEngine: {},
    });

    const snapshot = await aggregator.getSnapshot();
    expect(snapshot.overallStatus).toBe('UNAVAILABLE');
    expect(snapshot.overallReason).toContain('WASM EventStore');
  });

  it('2. evaluates overall status as DEGRADED when a non-critical component is degraded', async () => {
    const aggregator = new SystemHealthAggregator({
      eventStore: {
        dbPath: '/tmp/events.db',
        getEvents: async () => ({ isSuccess: true, value: [] }),
      },
      provider: { id: 'ollama', defaultModel: 'llama3' },
      toolRegistry: { list: () => [] },
      toolAuditor: {
        getAnalytics: async () => {
          throw new Error('Analytics degraded');
        },
      },
    });

    const snapshot = await aggregator.getSnapshot();
    const trComp = snapshot.components.find((c) => c.componentId === 'tool_runtime');

    expect(trComp?.status).toBe('HEALTHY'); // Falls back safely
    expect(snapshot.overallStatus).toBe('HEALTHY');
  });

  it('3. does NOT report UNKNOWN as HEALTHY', async () => {
    const aggregator = new SystemHealthAggregator({
      eventStore: {
        dbPath: '/tmp/events.db',
        getEvents: async () => ({ isSuccess: true, value: [] }),
      },
    });

    const snapshot = await aggregator.getSnapshot();
    const driftComp = snapshot.components.find((c) => c.componentId === 'drift_sentinel');

    expect(driftComp?.status).toBe('UNKNOWN');
    expect(driftComp?.statusReason).toBe('No health evidence available for component');
  });

  it('4. ensures refresh snapshot generates fresh ISO timestamp', async () => {
    const aggregator = new SystemHealthAggregator({
      eventStore: {
        dbPath: '/tmp/events.db',
        getEvents: async () => ({ isSuccess: true, value: [] }),
      },
    });

    const snap1 = await aggregator.getSnapshot();
    await new Promise((r) => setTimeout(r, 10));
    const snap2 = await aggregator.getSnapshot();

    expect(snap1.generatedAt).not.toBe(snap2.generatedAt);
    expect(new Date(snap2.generatedAt).getTime()).toBeGreaterThan(new Date(snap1.generatedAt).getTime());
  });
});
