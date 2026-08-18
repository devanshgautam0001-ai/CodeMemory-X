import { EventMetadata } from './EventMetadata.js';

export interface EventEnvelope<TPayload = unknown> {
  id: string;             // Unique Event ID (UUID v7 format)
  type: string;           // Event type string
  source: string;         // E.g., 'workspace-watcher', 'git-engine', 'parser-sdk'
  timestamp: string;      // ISO 8601 Timestamp
  correlationId: string; // Correlation ID for tracing event chains
  payload: TPayload;
  metadata: EventMetadata;
}
