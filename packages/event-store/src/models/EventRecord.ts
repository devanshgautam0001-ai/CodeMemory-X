export interface EventRecord<TPayload = unknown, TMetadata = Record<string, unknown>> {
  id: string;
  eventType: string;
  timestamp: string;
  correlationId: string;
  source: string;
  workspace: string;
  payload: TPayload;
  metadata: TMetadata;
  version?: number;
  createdAt?: string;
}

export interface StoredEventRow {
  id: string;
  event_type: string;
  timestamp: string;
  correlation_id: string;
  source: string;
  workspace: string;
  payload_json: string;
  metadata_json: string;
  version: number;
  created_at: string;
}

export interface QueryOptions {
  workspace?: string;
  correlationId?: string;
  eventType?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  limit?: number;
  offset?: number;
}
