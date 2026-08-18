import { Result, ok, fail } from '@codememory/shared';
import { DatabaseProvider, DatabaseProviderConfig } from '../database/DatabaseProvider.js';
import { MigrationRunner } from '../migrations/MigrationRunner.js';
import { EventRepository } from '../repository/EventRepository.js';
import { EventRecord, QueryOptions } from '../models/EventRecord.js';
import { ILogger } from '@codememory/logging';

export class EventStore {
  private dbProvider: DatabaseProvider;
  private repository!: EventRepository;
  private isInitialized = false;
  private isClosed = false;
  private isDirty = false;
  private flushTimer: any = null;
  private readonly debounceMs = 200;

  constructor(
    config: DatabaseProviderConfig = {},
    private readonly logger?: ILogger
  ) {
    this.dbProvider = new DatabaseProvider(config, this.logger);
  }

  public async initialize(): Promise<Result<void>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (this.isInitialized) return ok(undefined);

    try {
      const initRes = await this.dbProvider.initialize();
      if (initRes.isFailure) return fail(initRes.error);

      const db = initRes.value;
      const runner = new MigrationRunner(db, this.logger);
      const migRes = runner.runMigrations();
      if (migRes.isFailure) return fail(migRes.error);

      this.repository = new EventRepository(db, this.logger);
      this.isInitialized = true;
      this.logger?.info('EventStore initialized and migrations applied successfully');
      return ok(undefined);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async appendEvent(event: EventRecord): Promise<Result<void>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    const res = await this.repository.appendEvent(event);
    if (res.isSuccess) {
      this.markDirty();
    }
    return res;
  }

  public async appendBatch(events: EventRecord[]): Promise<Result<void>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    const res = await this.repository.appendBatch(events);
    if (res.isSuccess) {
      this.markDirty();
    }
    return res;
  }

  public async getEvent(id: string): Promise<Result<EventRecord | undefined>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    return this.repository.getEvent(id);
  }

  public async getEvents(options?: QueryOptions): Promise<Result<EventRecord[]>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    return this.repository.getEvents(options);
  }

  public async getEventsByCorrelation(correlationId: string): Promise<Result<EventRecord[]>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    return this.repository.getEventsByCorrelation(correlationId);
  }

  public async getEventsByWorkspace(workspace: string): Promise<Result<EventRecord[]>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    return this.repository.getEventsByWorkspace(workspace);
  }

  public async streamEvents(
    options?: QueryOptions,
    callback?: (event: EventRecord) => void
  ): Promise<Result<number>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    return this.repository.streamEvents(options, callback);
  }

  public async replay(
    options?: QueryOptions,
    targetHandler?: (event: EventRecord) => void
  ): Promise<Result<number>> {
    if (this.isClosed) return fail(new Error('EventStore is closed'));
    if (!this.isInitialized) {
      const initRes = await this.initialize();
      if (initRes.isFailure) return fail(initRes.error);
    }
    return this.repository.replay(options, targetHandler);
  }

  public async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.isDirty && this.isInitialized) {
      try {
        this.dbProvider.saveToDisk();
        this.isDirty = false;
        this.logger?.info('EventStore flushed database changes to disk');
      } catch (err) {
        this.logger?.error('Failed to flush EventStore to disk', err as Error);
      }
    }
  }

  public getDbPath(): string | undefined {
    return this.dbProvider.getDbPath() ?? undefined;
  }

  public close(): void {
    this.isClosed = true;
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.isDirty && this.isInitialized) {
      try {
        this.dbProvider.saveToDisk();
        this.isDirty = false;
      } catch (err) {
        this.logger?.error('Failed to flush EventStore during close', err as Error);
      }
    }
    this.dbProvider.close();
    this.isInitialized = false;
  }

  private markDirty(): void {
    this.isDirty = true;
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, this.debounceMs);
    }
  }
}
