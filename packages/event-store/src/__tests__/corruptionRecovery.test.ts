import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { EventStore } from '../store/EventStore.js';

describe('EventStore Corruption Recovery', () => {
  const testDir = path.join(__dirname, '__tmp_corrupt_test__');
  const dbPath = path.join(testDir, '.codememory', 'events.db');

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('backs up corrupted database and initializes a fresh database without crashing', async () => {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, 'INVALID_NOT_A_SQLITE_FILE_CONTENT');

    const store = new EventStore({ dbPath });
    const initRes = await store.initialize();

    expect(initRes.isSuccess).toBe(true);

    const files = fs.readdirSync(path.dirname(dbPath));
    const corruptFile = files.find((f) => f.includes('events.db.corrupt'));

    expect(corruptFile).toBeDefined();
    store.close();
  });
});
