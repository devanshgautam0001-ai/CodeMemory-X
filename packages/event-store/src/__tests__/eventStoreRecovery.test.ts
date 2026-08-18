import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventStore } from '../store/EventStore.js';
import * as fs from 'fs';
import * as path from 'path';

describe('TASK-059 EventStore Crash, Corruption & Recovery Hardening Suite', () => {
  let testDir: string;
  let dbPath: string;

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'temp_es_recovery_test_' + Date.now());
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    dbPath = path.join(testDir, 'events.db');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('1. initializes clean event store in new workspace', async () => {
    const store = new EventStore({ dbPath });
    await store.initialize();
    const res = await store.getEvents({});
    expect(res.isSuccess).toBe(true);
    expect(res.value).toEqual([]);
    await store.flush();
    store.close();
  });

  it('2. handles repeated flush calls without errors', async () => {
    const store = new EventStore({ dbPath });
    await store.initialize();
    await store.flush();
    await store.flush();
    await store.flush();
    expect(true).toBe(true);
    store.close();
  });

  it('3. cleans up stale temporary write files on initialization', async () => {
    const tmpFile = dbPath + '.tmp';
    fs.writeFileSync(tmpFile, 'stale temp data');
    expect(fs.existsSync(tmpFile)).toBe(true);

    const store = new EventStore({ dbPath });
    await store.initialize();
    expect(fs.existsSync(tmpFile)).toBe(false);
    store.close();
  });

  it('4. recovers safely from corrupted database file by recreating clean store', async () => {
    fs.writeFileSync(dbPath, 'Corrupted Non SQLite Garbage Header Bytes');
    const store = new EventStore({ dbPath });
    await store.initialize();

    const res = await store.getEvents({});
    expect(res.isSuccess).toBe(true);
    store.close();
  });
});
