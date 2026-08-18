import { describe, it, expect, vi } from 'vitest';
import { InMemoryEventBus } from '../services/InMemoryEventBus.js';

describe('InMemoryEventBus Duplicate Subscription Protection', () => {
  it('should prevent duplicate registrations for the same handler function reference', async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    // Subscribe same handler reference twice
    bus.subscribe('TEST_EVENT', handler);
    bus.subscribe('TEST_EVENT', handler);

    await bus.publish({
      id: 'evt_1',
      type: 'TEST_EVENT',
      timestamp: new Date().toISOString(),
      source: 'test',
      correlationId: 'corr_1',
      payload: {},
      metadata: { environment: 'test' },
    });

    // Handler should be called exactly once
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
