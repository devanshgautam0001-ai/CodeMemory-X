export interface MemoryRelationship {
  targetMemoryId: string;
  type: string; // e.g. 'AFFECTS', 'CAUSED_BY', 'REFACTORED_FROM', 'BOUND_TO'
}

export interface BaseMemory {
  id: string;
  type: string;
  summary: string;
  confidence: number;   // 0.0 - 1.0
  importance: number;   // 0.0 - 1.0
  recency: string;      // ISO 8601 Timestamp
  sourceEvents: string[]; // Event IDs
  relationships: MemoryRelationship[];
  metadata?: Record<string, unknown>;
}
