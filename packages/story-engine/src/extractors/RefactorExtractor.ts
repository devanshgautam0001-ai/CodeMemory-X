import { StoryRefactor } from '../types/StoryRefactor.js';
import { MemoryQueryEngine } from '@codememory/memory-query';

export class RefactorExtractor {
  public extractRefactors(symbolId: string, filePath: string, memoryQueryEngine?: MemoryQueryEngine): StoryRefactor[] {
    if (!memoryQueryEngine) return [];

    const refactors: StoryRefactor[] = [];
    const res = memoryQueryEngine.search({ query: filePath });

    for (const item of res.items) {
      if (item.memory.type === 'refactor') {
        const mem = item.memory;
        refactors.push({
          refactorId: mem.id,
          title: mem.summary,
          summary: mem.summary,
          timestamp: mem.recency ?? new Date().toISOString(),
          changedFiles: [filePath],
          affectedSymbols: [symbolId],
          confidence: mem.confidence ?? 0.90,
          evidenceEventIds: mem.sourceEvents ?? [mem.id],
        });
      }
    }

    return refactors;
  }
}
