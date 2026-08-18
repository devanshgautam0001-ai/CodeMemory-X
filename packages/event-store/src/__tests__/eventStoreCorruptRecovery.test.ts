import { describe, it, expect } from 'vitest';
import { EventStore } from '../store/EventStore.js';
import { EventRepository } from '../repository/EventRepository.js';

describe('EventRepository Corruption Recovery & Statement Freeing Suite', () => {
  it('1. recovers cleanly from malformed payload_json / metadata_json without throwing', async () => {
    const store = new EventStore({ dbPath: ':memory:' });
    const initRes = await store.initialize();
    expect(initRes.isSuccess).toBe(true);

    const db = (store as any).dbProvider.db;
    const repo = new EventRepository(db);

    // Manually insert a row with invalid JSON strings
    db.run(`
      INSERT INTO events (
        id, event_type, timestamp, correlation_id, source, workspace,
        payload_json, metadata_json, version, created_at
      ) VALUES (
        'evt_corrupt_01', 'FILE_MODIFIED', '2026-08-10T12:00:00Z', 'corr_01', 'test', 'ws',
        '{ invalid_json_payload_syntax: ', '{ invalid_json_metadata_syntax: ', 1, '2026-08-10T12:00:00Z'
      )
    `);

    // Query events — should NOT throw SyntaxError and should return fallback objects {}
    const getRes = await repo.getEvents({ workspace: 'ws' });
    expect(getRes.isSuccess).toBe(true);
    expect(getRes.value).toBeDefined();
    expect(getRes.value!.length).toBe(1);

    const record = getRes.value![0];
    expect(record.id).toBe('evt_corrupt_01');
    expect(record.payload).toEqual({});
    expect(record.metadata).toEqual({});

    await store.close();
  });

  it('2. getEvent(id) frees statement handle and recovers cleanly on malformed JSON', async () => {
    const store = new EventStore({ dbPath: ':memory:' });
    await store.initialize();
    const db = (store as any).dbProvider.db;
    const repo = new EventRepository(db);

    db.run(`
      INSERT INTO events (
        id, event_type, timestamp, correlation_id, source, workspace,
        payload_json, metadata_json, version, created_at
      ) VALUES (
        'evt_corrupt_02', 'SESSION_STARTED', '2026-08-10T12:00:00Z', 'corr_02', 'test', 'ws',
        '{{{bad_json', '{{{bad_json', 1, '2026-08-10T12:00:00Z'
      )
    `);

    const getRes = await repo.getEvent('evt_corrupt_02');
    expect(getRes.isSuccess).toBe(true);
    expect(getRes.value).toBeDefined();
    expect(getRes.value!.id).toBe('evt_corrupt_02');
    expect(getRes.value!.payload).toEqual({});

    await store.close();
  });
});
