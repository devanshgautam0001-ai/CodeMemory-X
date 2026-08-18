import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { EventStore } from '../store/EventStore.js';
import { EventRecord } from '../models/EventRecord.js';

describe('EventStore Workspace Lifecycle', () => {
  const wsA = path.join(__dirname, '__tmp_ws_a__');
  const wsB = path.join(__dirname, '__tmp_ws_b__');
  const dbPathA = path.join(wsA, '.codememory', 'events.db');
  const dbPathB = path.join(wsB, '.codememory', 'events.db');

  afterEach(() => {
    [wsA, wsB].forEach((dir) => {
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    });
  });

  it('isolates data between separate workspace roots', async () => {
    const storeA = new EventStore({ dbPath: dbPathA });
    const storeB = new EventStore({ dbPath: dbPathB });

    await storeA.initialize();
    await storeB.initialize();

    const evtA: EventRecord = {
      id: 'evt_a1',
      eventType: 'FILE_MODIFIED',
      timestamp: new Date().toISOString(),
      correlationId: 'cA',
      source: 'wsA',
      workspace: wsA,
      payload: { file: 'a.ts' },
      metadata: {},
      version: 1,
    };

    await storeA.appendEvent(evtA);
    await storeA.flush();

    const fetchAFromB = await storeB.getEvent('evt_a1');
    expect(fetchAFromB.value).toBeUndefined();

    storeA.close();
    storeB.close();
  });
});
