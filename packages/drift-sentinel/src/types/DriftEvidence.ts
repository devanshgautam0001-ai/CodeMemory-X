export interface DriftEvidence {
  id: string;
  source: string; // e.g. 'symbol-graph', 'memory-engine', 'git-engine', 'adr-decision'
  description: string;
  observedValue?: unknown;
  expectedValue?: unknown;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
