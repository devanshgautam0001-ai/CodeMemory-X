import { describe, it, expect } from 'vitest';
import { ContextBudgetManager } from '../budget/ContextBudgetManager.js';
import { BaseMemory } from '@codememory/memory-engine';

describe('ContextBudgetManager Token Trimming', () => {
  it('should trim items exceeding token budget limits', () => {
    const manager = new ContextBudgetManager();

    const items: BaseMemory[] = Array.from({ length: 20 }, (_, i) => ({
      id: `m_${i}`,
      type: 'decision',
      summary: `Decision summary ${i} for architectural choice #${i}`,
      confidence: 0.9,
      importance: 0.8,
      recency: new Date().toISOString(),
      sourceEvents: [`e_${i}`],
      relationships: [],
    }));

    // Limit to small token budget (e.g. 100 tokens)
    const { trimmed, isTrimmed } = manager.trimToBudget(items, 100);

    expect(isTrimmed).toBe(true);
    expect(trimmed.length).toBeLessThan(20);
  });
});
