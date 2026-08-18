export interface SessionIntent {
  intentId: string;
  type: string; // SupportedIntentType string (e.g. 'Refactor', 'Bug Fix')
  description: string;
  confidence: number;
  evidenceEventIds: string[];
  observedAt: string;
}
