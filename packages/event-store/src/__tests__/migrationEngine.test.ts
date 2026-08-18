import { describe, it, expect } from 'vitest';
import initSqlJs from 'sql.js';
import { MigrationRunner } from '../migrations/MigrationRunner.js';

describe('MigrationRunner Unit Tests', () => {
  it('applies migrations sequentially and updates user_version PRAGMA', async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    const runner = new MigrationRunner(db);
    expect(runner.getCurrentVersion()).toBe(0);

    const res = runner.runMigrations();
    expect(res.isSuccess).toBe(true);
    expect(runner.getCurrentVersion()).toBe(1);

    // Re-running migrations is idempotent
    const res2 = runner.runMigrations();
    expect(res2.isSuccess).toBe(true);
    expect(runner.getCurrentVersion()).toBe(1);

    db.close();
  });
});
