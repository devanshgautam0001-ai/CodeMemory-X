import { Database, Statement } from 'sql.js';
import { Result, ok, fail } from '@codememory/shared';
import { EventRecord, StoredEventRow, QueryOptions } from '../models/EventRecord.js';
import { ILogger } from '@codememory/logging';

export class EventRepository {
  constructor(
    private readonly db: Database,
    private readonly logger?: ILogger
  ) {}

  public async appendEvent(event: EventRecord): Promise<Result<void>> {
    try {
      const now = new Date().toISOString();
      const id = event.id || `evt_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
      const timestamp = event.timestamp || now;
      const correlationId = event.correlationId || id;

      const sql = `
        INSERT INTO events (
          id, event_type, timestamp, correlation_id, source, workspace,
          payload_json, metadata_json, version, created_at
        ) VALUES ($id, $event_type, $timestamp, $correlation_id, $source, $workspace, $payload_json, $metadata_json, $version, $created_at)
      `;

      this.db.run(sql, {
        '$id': id,
        '$event_type': event.eventType,
        '$timestamp': timestamp,
        '$correlation_id': correlationId,
        '$source': event.source,
        '$workspace': event.workspace,
        '$payload_json': JSON.stringify(event.payload || {}),
        '$metadata_json': JSON.stringify(event.metadata || {}),
        '$version': event.version || 1,
        '$created_at': now,
      });

      this.logger?.info(`[EventRepository] Appended event ${id} (${event.eventType})`);
      return ok(undefined);
    } catch (error) {
      this.logger?.error('Failed to append event to EventStore', error as Error);
      return fail(error as Error);
    }
  }

  public async appendBatch(events: EventRecord[]): Promise<Result<void>> {
    if (events.length === 0) return ok(undefined);

    try {
      this.db.exec('BEGIN TRANSACTION;');
      for (const event of events) {
        const res = await this.appendEvent(event);
        if (res.isFailure) {
          this.db.exec('ROLLBACK;');
          return res;
        }
      }
      this.db.exec('COMMIT;');
      this.logger?.info(`[EventRepository] Batch appended ${events.length} events in single transaction`);
      return ok(undefined);
    } catch (error) {
      this.db.exec('ROLLBACK;');
      this.logger?.error('Failed to append event batch to EventStore', error as Error);
      return fail(error as Error);
    }
  }

  public async getEvent(id: string): Promise<Result<EventRecord | undefined>> {
    try {
      const stmt = this.db.prepare('SELECT * FROM events WHERE id = $id');
      stmt.bind({ '$id': id });

      let record: EventRecord | undefined = undefined;
      try {
        if (stmt.step()) {
          const row = stmt.getAsObject() as unknown as StoredEventRow;
          record = this.mapRowToRecord(row);
        }
      } finally {
        stmt.free();
      }
      return ok(record);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getEvents(options: QueryOptions = {}): Promise<Result<EventRecord[]>> {
    try {
      const clauses: string[] = [];
      const params: Record<string, unknown> = {};

      if (options.workspace) {
        clauses.push('workspace = $workspace');
        params['$workspace'] = options.workspace;
      }
      if (options.correlationId) {
        clauses.push('correlation_id = $correlationId');
        params['$correlationId'] = options.correlationId;
      }
      if (options.eventType) {
        clauses.push('event_type = $eventType');
        params['$eventType'] = options.eventType;
      }
      if (options.fromTimestamp) {
        clauses.push('timestamp >= $fromTimestamp');
        params['$fromTimestamp'] = options.fromTimestamp;
      }
      if (options.toTimestamp) {
        clauses.push('timestamp <= $toTimestamp');
        params['$toTimestamp'] = options.toTimestamp;
      }

      let sql = 'SELECT * FROM events';
      if (clauses.length > 0) {
        sql += ' WHERE ' + clauses.join(' AND ');
      }
      sql += ' ORDER BY timestamp ASC';

      if (options.limit && options.limit > 0) {
        sql += ` LIMIT ${options.limit}`;
        if (options.offset && options.offset > 0) {
          sql += ` OFFSET ${options.offset}`;
        }
      }

      const stmt = this.db.prepare(sql);
      stmt.bind(params as any);

      const records: EventRecord[] = [];
      try {
        while (stmt.step()) {
          const row = stmt.getAsObject() as unknown as StoredEventRow;
          records.push(this.mapRowToRecord(row));
        }
      } finally {
        stmt.free();
      }

      return ok(records);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getEventsByCorrelation(correlationId: string): Promise<Result<EventRecord[]>> {
    return this.getEvents({ correlationId });
  }

  public async getEventsByWorkspace(workspace: string): Promise<Result<EventRecord[]>> {
    return this.getEvents({ workspace });
  }

  public async streamEvents(
    options: QueryOptions = {},
    callback?: (event: EventRecord) => void
  ): Promise<Result<number>> {
    try {
      const eventsRes = await this.getEvents(options);
      if (eventsRes.isFailure) return fail(eventsRes.error);

      let count = 0;
      for (const event of eventsRes.value) {
        callback?.(event);
        count++;
      }
      return ok(count);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async replay(
    options: QueryOptions = {},
    targetHandler?: (event: EventRecord) => void
  ): Promise<Result<number>> {
    return this.streamEvents(options, targetHandler);
  }

  private mapRowToRecord(row: StoredEventRow): EventRecord {
    let payload = {};
    let metadata = {};

    if (row.payload_json) {
      try {
        payload = JSON.parse(row.payload_json);
      } catch (err) {
        this.logger?.warn(`[EventRepository] Failed to parse payload_json for event ${row.id}:`, { error: (err as Error).message });
      }
    }

    if (row.metadata_json) {
      try {
        metadata = JSON.parse(row.metadata_json);
      } catch (err) {
        this.logger?.warn(`[EventRepository] Failed to parse metadata_json for event ${row.id}:`, { error: (err as Error).message });
      }
    }

    return {
      id: row.id,
      eventType: row.event_type,
      timestamp: row.timestamp,
      correlationId: row.correlation_id,
      source: row.source,
      workspace: row.workspace,
      payload,
      metadata,
      version: row.version,
      createdAt: row.created_at,
    };
  }
}
