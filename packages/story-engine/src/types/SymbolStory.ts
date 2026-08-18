import { SymbolStatus } from './StoryTypes.js';
import { SourceLocation, StoryBirth } from './StoryBirth.js';
import { StoryMilestone } from './StoryMilestone.js';
import { StoryContributor } from './StoryContributor.js';
import { StoryDecision } from './StoryDecision.js';
import { StoryBug } from './StoryBug.js';
import { StoryRefactor } from './StoryRefactor.js';
import { StoryDependency } from './StoryDependency.js';
import { StorySession } from './StorySession.js';
import { StoryMetrics } from './StoryMetrics.js';
import { StoryEvidence } from './StoryEvidence.js';
import { StoryRiskPoint } from './StoryRiskPoint.js';

export interface SymbolStory {
  symbolId: string;
  name: string;
  kind: string;
  language: string;
  filePath: string;
  currentLocation: SourceLocation;
  status: SymbolStatus;
  birth?: StoryBirth;
  milestones: StoryMilestone[];
  contributors: StoryContributor[];
  decisions: StoryDecision[];
  bugs: StoryBug[];
  refactors: StoryRefactor[];
  dependencies: StoryDependency[];
  sessions: StorySession[];
  metrics: StoryMetrics;
  riskHistory?: StoryRiskPoint[];
  confidence: number;
  evidence: StoryEvidence[];
  generatedAt: string;
}
