import { MemoryQueryEngine } from '@codememory/memory-query';
import { SessionRefactor } from '../types/DeveloperSession.js';

export class RefactorAggregator {
  public aggregate(activeFiles: string[], memoryQueryEngine?: MemoryQueryEngine): SessionRefactor[] {
    if (!memoryQueryEngine || activeFiles.length === 0) return [];

    const refactors: SessionRefactor[] = [];

    for (const filePath of activeFiles) {
      const res = memoryQueryEngine.search({ query: filePath });
      for (const item of res.items) {
        if (item.memory.type === 'refactor') {
          if (!refactors.some((r) => r.id === item.memory.id)) {
            refactors.push({
              id: item.memory.id,
              title: item.memory.summary,
              summary: item.memory.summary,
              confidence: item.memory.confidence ?? 0.90,
            });
          }
        }
      }
    }

    return refactors;
  }
}
