export interface AssistantContext {
  memories: any[];
  symbolStory?: any;
  sessionSummary?: any;
  driftFindings: any[];
  changeImpact?: any;
  decisions: any[];
  totalTokens: number;
  evidenceScores?: Record<string, { score: number; priority: string; signals: string[] }>;
}
