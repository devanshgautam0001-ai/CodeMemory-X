import { describe, it, expect, vi } from 'vitest';
import { InMemoryEventBus } from '../services/InMemoryEventBus.js';
import { EventEnvelope } from '../types/EventEnvelope.js';

describe('EventBus Publish & Subscribe', () => {
  it('should deliver published events to subscribers with auto-generated metadata', async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe('FILE_MODIFIED', handler);

    const event: EventEnvelope<{ file: string }> = {
      id: '',
      type: 'FILE_MODIFIED',
      source: 'workspace-watcher',
      timestamp: '',
      correlationId: '',
      payload: { file: 'src/main.ts' },
      metadata: {},
    };

    const result = await bus.publish(event);
    expect(result.isSuccess).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.id).toBeTruthy();
    expect(event.timestamp).toBeTruthy();
    expect(event.correlationId).toBe(event.id);

    unsubscribe();
  });

  it('should unsubscribe handlers correctly', async () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe('GIT_COMMIT', handler);
    unsubscribe();

    await bus.publish({
      id: 'e1',
      type: 'GIT_COMMIT',
      source: 'git-engine',
      timestamp: new Date().toISOString(),
      correlationId: 'c1',
      payload: {},
      metadata: {},
    });

    expect(handler).not.toHaveBeenCalled();
  });
});
