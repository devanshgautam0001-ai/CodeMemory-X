import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { Result, ok, fail } from '@codememory/shared';
import { ILogger } from '@codememory/logging';

export interface DatabaseProviderConfig {
  dbPath?: string;
  busyTimeout?: number;
  walMode?: boolean;
}

export class DatabaseProvider {
  private db: Database | null = null;
  private currentDbPath: string | null = null;

  constructor(
    private readonly config: DatabaseProviderConfig = {},
    private readonly logger?: ILogger
  ) {
    if (config.dbPath && config.dbPath !== ':memory:') {
      this.currentDbPath = config.dbPath;
    }
  }

  public async initialize(): Promise<Result<Database>> {
    if (this.db) {
      return ok(this.db);
    }
    try {
      const locateFile = (file: string) => {
        const distWasm = path.join(__dirname, file);
        if (fs.existsSync(distWasm)) {
          return distWasm;
        }
        try {
          const nmWasm = require.resolve('sql.js/dist/sql-wasm.wasm');
          if (fs.existsSync(nmWasm)) {
            return nmWasm;
          }
        } catch (e) {
          // ignore error
        }
        return file;
      };
      const SQL = await initSqlJs({ locateFile });
      let loadedFromDisk = false;

      if (this.currentDbPath) {
        const dir = path.dirname(this.currentDbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        }

        // Clean stale temporary write files if present
        const tmpPath = `${this.currentDbPath}.tmp`;
        if (fs.existsSync(tmpPath)) {
          try {
            fs.unlinkSync(tmpPath);
            this.logger?.warn('Cleaned stale temporary SQLite database file', { tmpPath });
          } catch (err) {
            this.logger?.warn('Failed to remove stale temporary file', { tmpPath, err });
          }
        }

        if (fs.existsSync(this.currentDbPath)) {
          try {
            const buffer = fs.readFileSync(this.currentDbPath);
            const isValidHeader = buffer.length >= 16 && buffer.toString('utf8', 0, 15) === 'SQLite format 3';
            if (!isValidHeader) {
              throw new Error('Invalid SQLite database file header');
            }
            this.db = new SQL.Database(buffer);
            this.db.run('PRAGMA foreign_keys = ON;');
            loadedFromDisk = true;
            this.logger?.info('Loaded SQLite database from workspace disk', { dbPath: this.currentDbPath, bytes: buffer.length });
          } catch (readErr) {
            this.logger?.error('Corrupted SQLite database detected during startup. Initiating recovery backup...', readErr as Error);
            const corruptPath = `${this.currentDbPath}.corrupt.${Date.now()}`;
            try {
              fs.copyFileSync(this.currentDbPath, corruptPath);
              this.logger?.info('Backed up corrupted SQLite database file', { corruptPath });
            } catch (copyErr) {
              this.logger?.error('Failed to copy corrupted database file', copyErr as Error);
            }
            this.db = new SQL.Database();
            this.db.run('PRAGMA foreign_keys = ON;');
          }
        } else {
          this.db = new SQL.Database();
          this.db.run('PRAGMA foreign_keys = ON;');
        }
      } else {
        this.db = new SQL.Database();
        this.db.run('PRAGMA foreign_keys = ON;');
      }

      this.logger?.info('Initialized WASM SQLite DatabaseProvider (sql.js)', {
        dbPath: this.currentDbPath || ':memory:',
        loadedFromDisk,
      });

      return ok(this.db);
    } catch (error) {
      this.logger?.error('Failed to initialize WASM SQLite DatabaseProvider', error as Error);
      return fail(error as Error);
    }
  }

  public getDb(): Database {
    if (!this.db) {
      throw new Error('DatabaseProvider not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public getDbPath(): string | null {
    return this.currentDbPath;
  }

  public exportBytes(): Uint8Array {
    const database = this.getDb();
    return database.export();
  }

  public saveToDisk(targetPath?: string): void {
    if (!this.db) return;
    const finalPath = targetPath ?? this.currentDbPath;
    if (!finalPath || finalPath === ':memory:') return;

    const dir = path.dirname(finalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }

    const tmpPath = `${finalPath}.tmp`;
    const data = this.exportBytes();

    fs.writeFileSync(tmpPath, data);
    fs.renameSync(tmpPath, finalPath);
    this.logger?.info('Saved SQLite database atomically to disk', { finalPath, bytes: data.length });
  }

  public close(): void {
    if (this.db) {
      if (this.currentDbPath) {
        try {
          this.saveToDisk();
        } catch (err) {
          this.logger?.error('Error saving SQLite database during close', err as Error);
        }
      }
      this.db.close();
      this.db = null;
      this.logger?.info('Closed WASM SQLite DatabaseProvider');
    }
  }
}
