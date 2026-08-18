import { describe, it, expect } from 'vitest';
import { ContextCompressor } from '../prompting/ContextCompressor.js';
import { PromptBudgetManager } from '../prompting/PromptBudgetManager.js';
import { AssistantContext } from '../types/AssistantContext.js';

describe('ContextCompressor Efficiency & Accuracy Suite', () => {
  it('1. prunes memories to fit under maxContextTokens accurately', () => {
    const budgetManager = new PromptBudgetManager(4096);
    const compressor = new ContextCompressor(budgetManager);

    const heavyMemories = Array.from({ length: 50 }, (_, i) => ({
      id: `mem_${i}`,
      type: 'file',
      title: `Memory Title ${i}`,
      summary: `Detailed summary content for memory index ${i} with substantial text payload to inflate token size.`,
      confidence: 0.8,
      importance: 0.5,
      recency: 'today',
      sourceEvents: [`evt_${i}`],
      relationships: [],
    }));

    const rawContext: AssistantContext = {
      memories: heavyMemories as any,
      symbolStory: null,
      sessionSummary: null,
      decisions: [],
      driftFindings: [],
      totalTokens: 2500,
    };

    const compressed = compressor.compress(rawContext, 500);

    expect(compressed.memories.length).toBeLessThan(heavyMemories.length);
    expect(compressed.totalTokens).toBeLessThanOrEqual(500);
  });
});
