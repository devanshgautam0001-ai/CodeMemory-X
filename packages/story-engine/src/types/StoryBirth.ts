import { RationaleCertainty } from './StoryTypes.js';

export interface SourceLocation {
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface StoryBirth {
  firstObservedAt: string;
  creationCommit?: string;
  author?: string;
  filePath: string;
  location?: SourceLocation;
  rationale?: string;
  rationaleCertainty: RationaleCertainty;
  confidence: number;
  evidenceEventIds: string[];
}
