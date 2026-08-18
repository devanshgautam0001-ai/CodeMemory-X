export interface StoryDecision {
  decisionId: string;
  title: string;
  rationale: string;
  status?: string;
  timestamp: string;
  relatedFiles: string[];
  relatedSymbols: string[];
  confidence: number;
  evidenceEventIds: string[];
}
