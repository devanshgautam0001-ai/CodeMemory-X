export interface SessionFile {
  filePath: string;
  firstSeen: string;
  lastSeen: string;
  editCount: number;
  changeCount: number;
  isActive: boolean;
  relatedSymbols: string[];
  importance: number;
  confidence: number;
}
