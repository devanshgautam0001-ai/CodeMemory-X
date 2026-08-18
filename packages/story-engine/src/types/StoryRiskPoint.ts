export interface StoryRiskPoint {
  timestamp: string;
  riskScore: number;
  impactScore: number;
  driftFindingIds: string[];
  reason: string;
  confidence: number;
}
