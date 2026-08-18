export interface ChangeInput {
  changedFiles: string[];
  changedSymbols?: string[];
  commitId?: string;
  eventIds?: string[];
  sessionId?: string;
}
