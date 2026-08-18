import { describe, it, expect } from 'vitest';
import { PromptBudgetManager } from '../prompting/PromptBudgetManager.js';
import { ContextCompressor } from '../prompting/ContextCompressor.js';

describe('PromptBudgetManager & ContextCompressor Unit Tests', () => {
  it('enforces token budget limits and compresses oversized context', () => {
    const budgetManager = new PromptBudgetManager(4096);
    const compressor = new ContextCompressor(budgetManager);

    const oversizedMemories = Array.from({ length: 50 }, (_, i) => ({
      id: `m_${i}`,
      summary: 'Very long text '.repeat(20),
    }));

    const rawContext = {
      memories: oversizedMemories,
      decisions: [],
      driftFindings: [],
      totalTokens: 10000,
    };

    const compressed = compressor.compress(rawContext, 500);
    expect(compressed.memories.length).toBeLessThan(oversizedMemories.length);
    expect(compressed.totalTokens).toBeLessThan(rawContext.totalTokens);
  });

  it('returns uncompressed context if total estimated tokens is within budget', () => {
    const budgetManager = new PromptBudgetManager(4096);
    const compressor = new ContextCompressor(budgetManager);

    const context = {
      memories: [{ id: 'm1' }],
      decisions: [{ id: 'd1' }],
      driftFindings: [],
      totalTokens: 200,
    };

    const compressed = compressor.compress(context, 1000);
    expect(compressed).toBe(context);
  });

  it('trims decisions when memories alone are not enough to meet budget', () => {
    const budgetManager = new PromptBudgetManager(4096);
    const compressor = new ContextCompressor(budgetManager);

    const oversizedDecisions = Array.from({ length: 20 }, (_, i) => ({
      id: `dec_${i}`,
      rationale: 'Long decision text '.repeat(30),
    }));

    const rawContext = {
      memories: [{ id: 'm1' }],
      decisions: oversizedDecisions,
      driftFindings: [],
      totalTokens: 10000,
    };

    const compressed = compressor.compress(rawContext, 200);
    expect(compressed.decisions.length).toBeLessThan(oversizedDecisions.length);
  });
});
