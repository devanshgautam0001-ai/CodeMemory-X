import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus.js';
import { DomainEvent } from '../DomainEvent.js';

describe('In-Memory Async EventBus', () => {
  it('should deliver published events to subscribers', async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const sampleEvent: DomainEvent<{ message: string }> = {
      eventName: 'MEMORY_CREATED',
      timestamp: new Date().toISOString(),
      payload: { message: 'Memory Atom persisted' },
    };

    bus.subscribe('MEMORY_CREATED', handler);
    await bus.publish(sampleEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(sampleEvent);
  });
});
