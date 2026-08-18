import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { EventStore } from '../store/EventStore.js';
import { EventRecord } from '../models/EventRecord.js';

describe('EventStore Disk Persistence', () => {
  const testDir = path.join(__dirname, '__tmp_persistence_test__');
  const dbPath = path.join(testDir, '.codememory', 'events.db');

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('persists SQLite database bytes to disk and rehydrates events on reopen', async () => {
    const store1 = new EventStore({ dbPath });
    await store1.initialize();

    const evt: EventRecord = {
      id: 'evt_p1',
      eventType: 'FILE_MODIFIED',
      timestamp: new Date().toISOString(),
      correlationId: 'c1',
      source: 'test',
      workspace: 'ws',
      payload: { file: 'a.ts' },
      metadata: {},
      version: 1,
    };

    await store1.appendEvent(evt);
    await store1.flush();
    store1.close();

    expect(fs.existsSync(dbPath)).toBe(true);

    // Reopen database from disk
    const store2 = new EventStore({ dbPath });
    await store2.initialize();
    const fetchRes = await store2.getEvent('evt_p1');

    expect(fetchRes.isSuccess).toBe(true);
    expect(fetchRes.value?.id).toBe('evt_p1');
    store2.close();
  });
});
