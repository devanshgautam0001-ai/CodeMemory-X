import { describe, it, expect } from 'vitest';
import { InMemoryEventBus } from '../services/InMemoryEventBus.js';

describe('EventBus Priority & Execution Ordering', () => {
  it('should execute higher priority subscribers before lower priority ones', async () => {
    const bus = new InMemoryEventBus();
    const executionOrder: string[] = [];

    bus.subscribe('PARSE_COMPLETE', () => { executionOrder.push('low'); }, { priority: 1 });
    bus.subscribe('PARSE_COMPLETE', () => { executionOrder.push('high'); }, { priority: 10 });
    bus.subscribe('PARSE_COMPLETE', () => { executionOrder.push('medium'); }, { priority: 5 });

    await bus.publish({
      id: 'e1',
      type: 'PARSE_COMPLETE',
      source: 'parser-sdk',
      timestamp: new Date().toISOString(),
      correlationId: 'c1',
      payload: {},
      metadata: {},
    });

    expect(executionOrder).toEqual(['high', 'medium', 'low']);
  });
});
