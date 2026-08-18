import { SessionState, ActivityLevel } from './SessionTypes.js';
import { SessionFile } from './SessionFile.js';
import { SessionSymbol } from './SessionSymbol.js';
import { SessionIntent } from './SessionIntent.js';
import { SessionEvidence } from './SessionEvidence.js';
import { SessionImpactSummary, SessionRisk } from './SessionSummary.js';

export interface SessionChange {
  id: string;
  type: string;
  filePath: string;
  timestamp: string;
}

export interface SessionDecision {
  id: string;
  title: string;
  summary: string;
  confidence: number;
}

export interface SessionBug {
  id: string;
  title: string;
  summary: string;
  confidence: number;
}

export interface SessionRefactor {
  id: string;
  title: string;
  summary: string;
  confidence: number;
}

export interface DeveloperSession {
  sessionId: string;
  workspace: string;
  startTime: string;
  lastActivityTime: string;
  durationMs: number;
  activeFiles: SessionFile[];
  activeSymbols: SessionSymbol[];
  recentChanges: SessionChange[];
  detectedIntents: SessionIntent[];
  relatedDecisions: SessionDecision[];
  relatedBugs: SessionBug[];
  relatedRefactors: SessionRefactor[];
  impactSummary?: SessionImpactSummary;
  architecturalRisks?: SessionRisk[];
  activityLevel: ActivityLevel;
  state: SessionState;
  confidence: number;
  evidence: SessionEvidence[];
  generatedAt: string;
}
