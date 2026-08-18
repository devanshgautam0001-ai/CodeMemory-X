import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { EventStore } from '../store/EventStore.js';
import { MemoryEngine } from '@codememory/memory-engine';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { EventRecord } from '../models/EventRecord.js';

describe('Restart Rehydration Pipeline Integration', () => {
  const testDir = path.join(__dirname, '__tmp_rehydrate_test__');
  const dbPath = path.join(testDir, '.codememory', 'events.db');

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('rehydrates MemoryEngine state after EventStore disk restart', async () => {
    const store1 = new EventStore({ dbPath });
    await store1.initialize();

    const evt: EventRecord = {
      id: 'evt_re1',
      eventType: 'FILE_MODIFIED',
      timestamp: new Date().toISOString(),
      correlationId: 'c_re1',
      source: 'watcher',
      workspace: testDir,
      payload: { filePath: 'src/main.ts', action: 'MODIFIED' },
      metadata: {},
      version: 1,
    };

    await store1.appendEvent(evt);
    await store1.flush();
    store1.close();

    // Re-initialize from disk
    const store2 = new EventStore({ dbPath });
    await store2.initialize();

    const memoryEngine = new MemoryEngine(store2);
    const rebuildRes = await memoryEngine.rebuild();
    expect(rebuildRes.isSuccess).toBe(true);

    const queryEngine = new MemoryQueryEngine((memoryEngine as any).repository);
    const searchRes = queryEngine.search({ query: 'main.ts' });

    expect(searchRes.items.length).toBeGreaterThan(0);
    store2.close();
  });
});
