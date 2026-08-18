import { SessionState, ActivityLevel } from './SessionTypes.js';

export interface SessionImpactSummary {
  totalAffectedEntities: number;
  highImpactEntities: number;
  overallImpactScore: number;
  overallConfidence: number;
}

export interface SessionRisk {
  id: string;
  type: string;
  severity: string;
  title: string;
  summary: string;
}

export interface SessionSummary {
  primaryFocus: string[];
  dominantState: SessionState;
  dominantIntent?: string;
  filesChanged: number;
  symbolsTouched: number;
  decisionsRelated: number;
  bugsRelated: number;
  refactorsRelated: number;
  highImpactChanges: number;
  architecturalRisks: number;
  activityLevel: ActivityLevel;
  confidence: number;
}
