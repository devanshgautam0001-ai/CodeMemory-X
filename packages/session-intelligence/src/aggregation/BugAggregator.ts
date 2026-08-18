import { MemoryQueryEngine } from '@codememory/memory-query';
import { SessionBug } from '../types/DeveloperSession.js';

export class BugAggregator {
  public aggregate(activeFiles: string[], memoryQueryEngine?: MemoryQueryEngine): SessionBug[] {
    if (!memoryQueryEngine || activeFiles.length === 0) return [];

    const bugs: SessionBug[] = [];

    for (const filePath of activeFiles) {
      const res = memoryQueryEngine.search({ query: filePath });
      for (const item of res.items) {
        if (item.memory.type === 'bug') {
          if (!bugs.some((b) => b.id === item.memory.id)) {
            bugs.push({
              id: item.memory.id,
              title: item.memory.summary,
              summary: item.memory.summary,
              confidence: item.memory.confidence ?? 0.90,
            });
          }
        }
      }
    }

    return bugs;
  }
}
