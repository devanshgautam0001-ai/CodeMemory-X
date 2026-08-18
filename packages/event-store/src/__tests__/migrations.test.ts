import { describe, it, expect, afterEach } from 'vitest';
import { DatabaseProvider } from '../database/DatabaseProvider.js';
import { MigrationRunner } from '../migrations/MigrationRunner.js';

describe('EventStore Database Migrations & Pragmas', () => {
  let dbProvider: DatabaseProvider;

  afterEach(() => {
    dbProvider?.close();
  });

  it('should initialize WASM SQLite with table schema and indexes', async () => {
    dbProvider = new DatabaseProvider();
    const initRes = await dbProvider.initialize();
    expect(initRes.isSuccess).toBe(true);

    if (initRes.isSuccess) {
      const db = initRes.value;
      const runner = new MigrationRunner(db);
      const migRes = runner.runMigrations();

      expect(migRes.isSuccess).toBe(true);

      const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'");
      expect(stmt.step()).toBe(true);
      stmt.free();

      const idxStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='events'");
      const indexNames: string[] = [];
      while (idxStmt.step()) {
        indexNames.push(idxStmt.getAsObject().name as string);
      }
      idxStmt.free();

      expect(indexNames).toContain('idx_events_timestamp');
      expect(indexNames).toContain('idx_events_workspace');
      expect(indexNames).toContain('idx_events_correlation_id');
      expect(indexNames).toContain('idx_events_event_type');
    }
  });
});
