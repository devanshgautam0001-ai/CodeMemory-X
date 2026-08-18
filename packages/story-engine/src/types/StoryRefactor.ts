export interface StoryRefactor {
  refactorId: string;
  title: string;
  summary: string;
  timestamp: string;
  changedFiles: string[];
  oldPaths?: string[];
  newPaths?: string[];
  affectedSymbols: string[];
  confidence: number;
  evidenceEventIds: string[];
}
