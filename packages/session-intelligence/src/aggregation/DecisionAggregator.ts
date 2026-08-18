import { MemoryQueryEngine } from '@codememory/memory-query';
import { SessionDecision } from '../types/DeveloperSession.js';

export class DecisionAggregator {
  public aggregate(activeFiles: string[], memoryQueryEngine?: MemoryQueryEngine): SessionDecision[] {
    if (!memoryQueryEngine || activeFiles.length === 0) return [];

    const decisions: SessionDecision[] = [];

    for (const filePath of activeFiles) {
      const res = memoryQueryEngine.search({ query: filePath });
      for (const item of res.items) {
        if (item.memory.type === 'decision') {
          if (!decisions.some((d) => d.id === item.memory.id)) {
            decisions.push({
              id: item.memory.id,
              title: (item.memory as any).decisionTitle ?? item.memory.summary,
              summary: item.memory.summary,
              confidence: item.memory.confidence ?? 0.90,
            });
          }
        }
      }
    }

    return decisions;
  }
}
