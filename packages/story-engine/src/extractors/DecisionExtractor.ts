import { StoryDecision } from '../types/StoryDecision.js';
import { MemoryQueryEngine } from '@codememory/memory-query';

export class DecisionExtractor {
  public extractDecisions(symbolId: string, filePath: string, memoryQueryEngine?: MemoryQueryEngine): StoryDecision[] {
    if (!memoryQueryEngine) return [];

    const decisions: StoryDecision[] = [];
    const res = memoryQueryEngine.search({ query: filePath });

    for (const item of res.items) {
      if (item.memory.type === 'decision') {
        const mem = item.memory;
        decisions.push({
          decisionId: mem.id,
          title: (mem as any).decisionTitle ?? mem.summary,
          rationale: (mem as any).rationale ?? mem.summary,
          timestamp: mem.recency ?? new Date().toISOString(),
          relatedFiles: [filePath],
          relatedSymbols: [symbolId],
          confidence: mem.confidence ?? 0.95,
          evidenceEventIds: mem.sourceEvents ?? [mem.id],
        });
      }
    }

    return decisions;
  }
}
