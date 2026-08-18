import { DriftType, DriftSeverity } from './DriftTypes.js';
import { DriftEvidence } from './DriftEvidence.js';

export interface DriftFinding {
  id: string;
  type: DriftType;
  severity: DriftSeverity;
  score: number;
  title: string;
  summary: string;
  affectedFiles: string[];
  affectedSymbols: string[];
  affectedPackages: string[];
  baselineEvidence: DriftEvidence[];
  currentEvidence: DriftEvidence[];
  relatedDecisions: string[];
  relatedMemories: string[];
  confidence: number;
  detectedAt: string;
  acknowledged?: boolean;
}
