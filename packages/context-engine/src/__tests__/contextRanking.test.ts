import { describe, it, expect } from 'vitest';
import { ContextRanker } from '../ranker/ContextRanker.js';
import { BaseMemory, SymbolMemory } from '@codememory/memory-engine';

describe('ContextRanker Focus Relevance', () => {
  it('should rank active symbol and selected file memories higher', () => {
    const ranker = new ContextRanker();
    const activeSymMem: SymbolMemory = {
      id: 's1',
      type: 'symbol',
      symbolName: 'AuthService',
      symbolKind: 'class',
      filePath: '/workspace/src/AuthService.ts',
      callCount: 10,
      summary: 'AuthService class',
      confidence: 0.9,
      importance: 0.8,
      recency: new Date().toISOString(),
      sourceEvents: ['e1'],
      relationships: [],
    };

    const otherMem: BaseMemory = {
      id: 'o1',
      type: 'file',
      summary: 'Other file',
      confidence: 0.5,
      importance: 0.4,
      recency: new Date().toISOString(),
      sourceEvents: ['e2'],
      relationships: [],
    };

    const scored = ranker.rankContextMemories([otherMem, activeSymMem], {
      activeSymbol: 'AuthService',
      selectedFile: '/workspace/src/AuthService.ts',
    });

    expect(scored[0].memory.id).toBe('s1');
    expect(scored[0].relevanceScore).toBeGreaterThan(scored[1].relevanceScore);
  });
});
