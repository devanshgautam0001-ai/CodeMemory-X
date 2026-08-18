import { MilestoneType } from './StoryTypes.js';

export interface StoryMilestone {
  id: string;
  timestamp: string;
  type: MilestoneType;
  title: string;
  summary: string;
  commitHash?: string;
  sessionId?: string;
  changedFiles: string[];
  relatedSymbols: string[];
  evidenceEventIds: string[];
  confidence: number;
}
