export interface DecisionObject {
  id: string;
  title: string;
  description: string;
  reason: string;
  confidence: number; // 0.0 to 1.0
  timestamp: string;
  relatedSymbols: string[];
  relatedFiles: string[];
  relatedIntents: string[];
  relatedSessions: string[];
  status?: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  metadata?: Record<string, unknown>;
}

export interface DecisionExtractionContext {
  filePath?: string;
  fileContent?: string;
  commitMessage?: string;
  eventType?: string;
  eventPayload?: Record<string, unknown>;
  modifiedFiles?: string[];
  sessionId?: string;
}
