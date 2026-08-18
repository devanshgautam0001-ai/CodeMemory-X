import { describe, it, expect } from 'vitest';
import { SystemHealthAggregator } from '../health/SystemHealthAggregator.js';

describe('SystemHealthAggregator RPC Provider Exception Safety Suite', () => {
  it('1. returns HEALTHY RPC bridge status without throwing when rpcMetricsProvider throws an error', async () => {
    const aggregator = new SystemHealthAggregator({
      rpcMetricsProvider: () => {
        throw new Error('RPC Provider failure');
      },
    });

    const snapshot = await aggregator.getSnapshot();
    const rpcComp = snapshot.components.find((c) => c.componentId === 'rpc_bridge');

    expect(rpcComp).toBeDefined();
    expect(rpcComp?.status).toBe('HEALTHY');
    expect(rpcComp?.eventCount).toBe(0);
  });

  it('2. handles rpcMetricsProvider returning null or undefined safely', async () => {
    const aggregator = new SystemHealthAggregator({
      rpcMetricsProvider: () => null as any,
    });

    const snapshot = await aggregator.getSnapshot();
    const rpcComp = snapshot.components.find((c) => c.componentId === 'rpc_bridge');

    expect(rpcComp).toBeDefined();
    expect(rpcComp?.status).toBe('HEALTHY');
    expect(rpcComp?.eventCount).toBe(0);
  });
});
