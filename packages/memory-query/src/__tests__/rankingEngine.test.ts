import { describe, it, expect } from 'vitest';
import { RankingEngine } from '../ranking/RankingEngine.js';
import { BaseMemory } from '@codememory/memory-engine';

describe('RankingEngine Composite Score Calculation', () => {
  it('should rank memories based on importance, confidence, recency, and relationships', () => {
    const ranker = new RankingEngine();
    const now = new Date().toISOString();
    const oldTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(); // 30 days ago

    const memHigh: BaseMemory = {
      id: 'm1',
      type: 'decision',
      summary: 'Critical ADR',
      importance: 0.95,
      confidence: 0.9,
      recency: now,
      sourceEvents: ['e1'],
      relationships: [{ targetMemoryId: 'm2', type: 'BOUND_TO' }],
    };

    const memLow: BaseMemory = {
      id: 'm2',
      type: 'file',
      summary: 'Old File edit',
      importance: 0.2,
      confidence: 0.3,
      recency: oldTime,
      sourceEvents: ['e2'],
      relationships: [],
    };

    const ranked = ranker.rankMemories([memLow, memHigh]);

    expect(ranked).toHaveLength(2);
    expect(ranked[0].memory.id).toBe('m1');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });
});
