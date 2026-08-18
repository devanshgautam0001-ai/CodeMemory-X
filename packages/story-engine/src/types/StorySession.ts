export interface StorySession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  state: string;
  intent?: string;
  changes: number;
  decisions: number;
  bugs: number;
  refactors: number;
  confidence: number;
}
