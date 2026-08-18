import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseProvider } from '../database/DatabaseProvider.js';

describe('DatabaseProvider Atomic File Writes', () => {
  const testDir = path.join(__dirname, '__tmp_atomic_test__');
  const dbPath = path.join(testDir, '.codememory', 'events.db');

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('performs atomic writes via temporary file replacement and cleans up stale tmp files', async () => {
    const provider = new DatabaseProvider({ dbPath });
    await provider.initialize();

    provider.saveToDisk();

    expect(fs.existsSync(dbPath)).toBe(true);
    expect(fs.existsSync(`${dbPath}.tmp`)).toBe(false);

    provider.close();
  });
});
