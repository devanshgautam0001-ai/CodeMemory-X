import { BaseMemory, SymbolMemory } from '@codememory/memory-engine';
import { DeveloperFocus } from '../types/DeveloperFocus.js';

export interface ScoredContextMemory {
  memory: BaseMemory;
  relevanceScore: number;
}

export class ContextRanker {
  public rankContextMemories(memories: BaseMemory[], focus: DeveloperFocus): ScoredContextMemory[] {
    const activeSym = focus.activeSymbol?.toLowerCase();
    const activeFile = focus.selectedFile?.toLowerCase();

    const scored = memories.map((mem) => {
      let symbolRelevance = 0.5;
      if (mem.type === 'symbol' && activeSym) {
        const symMem = mem as SymbolMemory;
        if (symMem.symbolName.toLowerCase() === activeSym) {
          symbolRelevance = 1.0;
        }
      }

      let fileRelevance = 0.5;
      if ((mem as any).filePath && activeFile) {
        if ((mem as any).filePath.toLowerCase() === activeFile) {
          fileRelevance = 1.0;
        }
      }

      const importance = mem.importance || 0.5;
      const confidence = mem.confidence || 0.5;

      const totalScore =
        importance * 0.3 +
        confidence * 0.2 +
        symbolRelevance * 0.25 +
        fileRelevance * 0.25;

      return {
        memory: mem,
        relevanceScore: Number(totalScore.toFixed(4)),
      };
    });

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scored;
  }
}
