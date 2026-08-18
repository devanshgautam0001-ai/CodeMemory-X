import { describe, it, expect } from 'vitest';
import { ContextRanker } from '../context/ContextRanker.js';
import { ContextCompressor } from '../prompting/ContextCompressor.js';
import { PromptBudgetManager } from '../prompting/PromptBudgetManager.js';
import { SystemPromptBuilder } from '../prompting/SystemPromptBuilder.js';
import { AssistantContext } from '../types/AssistantContext.js';

describe('Evidence & Budget Hardening Unit Tests', () => {
  it('strictly enforces CRITICAL > HIGH > MEDIUM > LOW priority bucketing', () => {
    const items = [
      { id: 'item_low', title: 'Background item', type: 'memory' },
      { id: 'item_med', title: 'Session notes', type: 'session', sessionId: 's1' },
      { id: 'item_high', title: 'ADR decision', type: 'decision', filePath: 'src/main.ts' },
      { id: 'item_crit', title: 'High Drift Warning', type: 'drift', severity: 'critical' },
    ];

    const request = {
      requestId: 'req_1',
      prompt: 'Check system health',
    };

    const res = ContextRanker.rankItems(items, request);

    expect(res.itemScores['item_crit'].priority).toBe('CRITICAL');
    expect(res.itemScores['item_high'].priority).toBe('HIGH');
    expect(res.itemScores['item_med'].priority).toBe('MEDIUM');
    expect(res.itemScores['item_low'].priority).toBe('LOW');

    expect(res.rankedItems[0].id).toBe('item_crit');
    expect(res.rankedItems[1].id).toBe('item_high');
    expect(res.rankedItems[2].id).toBe('item_med');
    expect(res.rankedItems[3].id).toBe('item_low');
  });

  it('prunes lowest-priority and lowest-score items first during context compression', () => {
    const budgetManager = new PromptBudgetManager(100);
    const compressor = new ContextCompressor(budgetManager);

    const initialContext: AssistantContext = {
      memories: [
        { id: 'mem_high', summary: 'Critical memory details about auth' },
        { id: 'mem_low', summary: 'Obsolete random background log' },
      ],
      decisions: [{ id: 'dec_1', title: 'ADR 001' }],
      driftFindings: [],
      totalTokens: 500,
      evidenceScores: {
        mem_high: { score: 9.0, priority: 'CRITICAL', signals: ['Symbol match'] },
        mem_low: { score: 1.2, priority: 'LOW', signals: ['Background'] },
        dec_1: { score: 7.0, priority: 'HIGH', signals: ['ADR'] },
      },
    };

    const compressed = compressor.compress(initialContext, 100);

    // mem_low (LOW priority) must be pruned before mem_high (CRITICAL priority)
    expect(compressed.memories.some((m) => m.id === 'mem_low')).toBe(false);
  });

  it('formats system prompt with priority and score evidence annotations', () => {
    const builder = new SystemPromptBuilder();
    const context: AssistantContext = {
      memories: [{ id: 'm1', type: 'memory', summary: 'Auth Token Expiry' }],
      decisions: [],
      driftFindings: [],
      totalTokens: 50,
      evidenceScores: {
        m1: { score: 8.5, priority: 'CRITICAL', signals: ['Symbol Match'] },
      },
    };

    const prompt = builder.buildSystemPrompt(context);
    expect(prompt).toContain('[CRITICAL | Score 8.5]');
    expect(prompt).toContain('Auth Token Expiry');
  });
});
