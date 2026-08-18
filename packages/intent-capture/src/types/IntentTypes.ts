export type SupportedIntentType =
  | 'Bug Fix'
  | 'Refactor'
  | 'Optimization'
  | 'Cleanup'
  | 'Experiment'
  | 'Feature'
  | 'Architecture'
  | 'Documentation'
  | 'Technical Debt'
  | 'Temporary Workaround';

export interface IntentObject {
  id: string;
  type: SupportedIntentType;
  confidence: number; // 0.0 to 1.0
  reason: string;
  affectedFiles: string[];
  affectedSymbols: string[];
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface IntentExtractionContext {
  filePath?: string;
  codeContent?: string;
  commitMessage?: string;
  eventType?: string;
  eventPayload?: Record<string, unknown>;
  editFrequency?: number;
}
