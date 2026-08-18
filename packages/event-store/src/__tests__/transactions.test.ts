import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventStore } from '../store/EventStore.js';
import { EventRecord } from '../models/EventRecord.js';

describe('EventStore Transactions & Batch Insert', () => {
  let store: EventStore;

  beforeEach(async () => {
    store = new EventStore();
    await store.initialize();
  });

  afterEach(() => {
    store.close();
  });

  it('should insert large batch of events in a single transaction efficiently', async () => {
    const batch: EventRecord[] = Array.from({ length: 50 }, (_, i) => ({
      id: `evt_${i}`,
      eventType: 'FILE_MODIFIED',
      timestamp: new Date().toISOString(),
      correlationId: 'batch-c1',
      source: 'watcher',
      workspace: '/workspace/project',
      payload: { index: i },
      metadata: {},
    }));

    const appendRes = await store.appendBatch(batch);
    expect(appendRes.isSuccess).toBe(true);

    const queryRes = await store.getEventsByCorrelation('batch-c1');
    expect(queryRes.isSuccess).toBe(true);
    if (queryRes.isSuccess) {
      expect(queryRes.value).toHaveLength(50);
      expect(queryRes.value[0].payload).toEqual({ index: 0 });
    }
  });

  it('should enforce immutable append-only constraints (no update or delete methods)', () => {
    expect((store as any).updateEvent).toBeUndefined();
    expect((store as any).deleteEvent).toBeUndefined();
  });
});
