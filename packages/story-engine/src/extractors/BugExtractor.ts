import { StoryBug } from '../types/StoryBug.js';
import { MemoryQueryEngine } from '@codememory/memory-query';

export class BugExtractor {
  public extractBugs(symbolId: string, filePath: string, memoryQueryEngine?: MemoryQueryEngine): StoryBug[] {
    if (!memoryQueryEngine) return [];

    const bugs: StoryBug[] = [];
    const res = memoryQueryEngine.search({ query: filePath });

    for (const item of res.items) {
      if (item.memory.type === 'bug') {
        const mem = item.memory;
        bugs.push({
          bugId: mem.id,
          title: mem.summary,
          description: mem.summary,
          severity: 'HIGH',
          status: 'RESOLVED',
          resolvedAt: mem.recency ?? new Date().toISOString(),
          relatedFiles: [filePath],
          relatedSymbols: [symbolId],
          confidence: mem.confidence ?? 0.90,
          evidenceEventIds: mem.sourceEvents ?? [mem.id],
        });
      }
    }

    return bugs;
  }
}
