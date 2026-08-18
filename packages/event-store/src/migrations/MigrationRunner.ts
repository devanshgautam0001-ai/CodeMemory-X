import { Database } from 'sql.js';
import { Result, ok, fail } from '@codememory/shared';
import { ILogger } from '@codememory/logging';

export interface MigrationStep {
  version: number;
  description: string;
  sql: string;
}

export class MigrationRunner {
  private readonly migrations: MigrationStep[] = [
    {
      version: 1,
      description: 'Initial EventStore schema with events table and performance indexes',
      sql: `
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          correlation_id TEXT NOT NULL,
          source TEXT NOT NULL,
          workspace TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          metadata_json TEXT NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_workspace ON events(workspace);
        CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON events(correlation_id);
        CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
      `,
    },
  ];

  constructor(
    private readonly db: Database,
    private readonly logger?: ILogger
  ) {}

  public getCurrentVersion(): number {
    try {
      const res = this.db.exec('PRAGMA user_version;');
      if (res.length > 0 && res[0].values.length > 0) {
        return Number(res[0].values[0][0]) || 0;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  public runMigrations(): Result<void> {
    try {
      const currentVer = this.getCurrentVersion();
      this.logger?.info(`[MigrationRunner] Current schema version: v${currentVer}`);

      for (const mig of this.migrations) {
        if (mig.version > currentVer) {
          this.logger?.info(`[MigrationRunner] Applying migration v${mig.version}: ${mig.description}`);
          this.db.exec('BEGIN TRANSACTION;');
          this.db.exec(mig.sql);
          this.db.exec(`PRAGMA user_version = ${mig.version};`);
          this.db.exec('COMMIT;');
        }
      }

      this.logger?.info('EventStore schema migrations completed successfully.');
      return ok(undefined);
    } catch (error) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {
        // Ignored
      }
      this.logger?.error('EventStore schema migration failed', error as Error);
      return fail(error as Error);
    }
  }
}
