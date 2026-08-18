import { describe, it, expect, vi } from 'vitest';
import { InMemoryEventBus } from '../services/InMemoryEventBus.js';

describe('EventBus Correlation ID Tracing & Filtering', () => {
  it('should filter events by correlation ID when filter is specified', async () => {
    const bus = new InMemoryEventBus();
    const handlerCorrA = vi.fn();
    const handlerCorrB = vi.fn();

    bus.subscribe('GIT_BRANCH_CHANGE', handlerCorrA, { correlationIdFilter: 'corr-A' });
    bus.subscribe('GIT_BRANCH_CHANGE', handlerCorrB, { correlationIdFilter: 'corr-B' });

    await bus.publish({
      id: 'e1',
      type: 'GIT_BRANCH_CHANGE',
      source: 'git-engine',
      timestamp: new Date().toISOString(),
      correlationId: 'corr-A',
      payload: { branch: 'main' },
      metadata: {},
    });

    expect(handlerCorrA).toHaveBeenCalledTimes(1);
    expect(handlerCorrB).not.toHaveBeenCalled();
  });
});
