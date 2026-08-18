export interface StoryBug {
  bugId: string;
  title: string;
  description: string;
  severity?: string;
  status?: string;
  introducedAt?: string;
  resolvedAt?: string;
  relatedFiles: string[];
  relatedSymbols: string[];
  confidence: number;
  evidenceEventIds: string[];
}
