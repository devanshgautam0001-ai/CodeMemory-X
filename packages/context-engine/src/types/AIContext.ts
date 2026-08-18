import {
  BaseMemory,
  FileMemory,
  SymbolMemory,
  DecisionMemory,
  BugMemory,
  RefactorMemory,
  SessionMemory,
} from '@codememory/memory-engine';

export interface AIContext {
  relevantMemories: BaseMemory[];
  relevantSymbols: SymbolMemory[];
  relevantDecisions: DecisionMemory[];
  recentChanges: FileMemory[];
  relatedBugs: BugMemory[];
  relatedRefactors: RefactorMemory[];
  currentSession?: SessionMemory;
  formattedText: string;
  estimatedTokens: number;
  tokenBudget: number;
  compressed: boolean;
}
