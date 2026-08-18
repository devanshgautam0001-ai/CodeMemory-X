import { BaseMemory } from './BaseMemory.js';
export { BaseMemory };

export interface FileMemory extends BaseMemory {
  type: 'file';
  filePath: string;
  editCount: number;
  authors: string[];
  lastModifiedAt: string;
}

export interface SymbolMemory extends BaseMemory {
  type: 'symbol';
  symbolName: string;
  symbolKind: string;
  filePath: string;
  callCount: number;
}

export interface DecisionMemory extends BaseMemory {
  type: 'decision';
  decisionTitle: string;
  rationale: string;
  author: string;
  boundSymbols: string[];
}

export interface BugMemory extends BaseMemory {
  type: 'bug';
  bugDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  resolvedAt?: string;
}

export interface RefactorMemory extends BaseMemory {
  type: 'refactor';
  refactorScope: string;
  affectedFiles: string[];
  rationale: string;
}

export interface DeveloperIntentMemory extends BaseMemory {
  type: 'intent';
  intentType: string;
  goal: string;
  activeFiles: string[];
}

export interface SessionMemory extends BaseMemory {
  type: 'session';
  sessionId: string;
  startTime: string;
  endTime?: string;
  modifiedFilesCount: number;
}

export type MemoryModel =
  | FileMemory
  | SymbolMemory
  | DecisionMemory
  | BugMemory
  | RefactorMemory
  | DeveloperIntentMemory
  | SessionMemory;
