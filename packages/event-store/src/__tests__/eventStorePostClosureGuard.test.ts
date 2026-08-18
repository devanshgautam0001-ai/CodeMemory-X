import { describe, it, expect } from 'vitest';
import { EventStore } from '../store/EventStore.js';

describe('EventStore Post-Closure Guard', () => {
  it('should reject operations cleanly after close() has been called', async () => {
    const store = new EventStore({ dbPath: ':memory:' });
    const initRes = await store.initialize();
    expect(initRes.isSuccess).toBe(true);

    store.close();

    const appendRes = await store.appendEvent({
      id: 'evt_post_close',
      eventType: 'FILE_MODIFIED',
      timestamp: new Date().toISOString(),
      source: 'test',
      payload: {},
    });

    expect(appendRes.isFailure).toBe(true);
    expect(appendRes.error.message).toContain('EventStore is closed');
  });
});
