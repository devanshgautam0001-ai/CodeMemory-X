import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventStore } from '../store/EventStore.js';
import { EventRecord } from '../models/EventRecord.js';

describe('EventStore Event Replay & Streaming', () => {
  let store: EventStore;

  beforeEach(async () => {
    store = new EventStore();
    await store.initialize();
  });

  afterEach(() => {
    store.close();
  });

  it('should stream and replay historical events in chronological order', async () => {
    const e1: EventRecord = {
      id: 'e1',
      eventType: 'WORKSPACE_OPEN',
      timestamp: '2026-08-07T10:00:00Z',
      correlationId: 'c1',
      source: 'watcher',
      workspace: '/project',
      payload: {},
      metadata: {},
    };

    const e2: EventRecord = {
      id: 'e2',
      eventType: 'FILE_MODIFIED',
      timestamp: '2026-08-07T10:05:00Z',
      correlationId: 'c1',
      source: 'watcher',
      workspace: '/project',
      payload: { file: 'app.ts' },
      metadata: {},
    };

    await store.appendBatch([e1, e2]);

    const replayHandler = vi.fn();
    const replayRes = await store.replay({ correlationId: 'c1' }, replayHandler);

    expect(replayRes.isSuccess).toBe(true);
    if (replayRes.isSuccess) {
      expect(replayRes.value).toBe(2);
    }

    expect(replayHandler).toHaveBeenCalledTimes(2);
    expect(replayHandler.mock.calls[0][0].id).toBe('e1');
    expect(replayHandler.mock.calls[1][0].id).toBe('e2');
  });
});
