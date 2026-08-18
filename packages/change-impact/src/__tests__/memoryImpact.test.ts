import { describe, it, expect, vi } from 'vitest';
import { MemoryImpactAnalyzer } from '../analyzers/MemoryImpactAnalyzer.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

describe('MemoryImpactAnalyzer', () => {
  const analyzer = new MemoryImpactAnalyzer();
  const scorer = new ImpactScorer();

  it('surfaces DECISION_IMPACT when memory query engine finds matching ADR decision', () => {
    const mockQueryEngine = {
      search: vi.fn().mockReturnValue({
        items: [
          {
            memory: {
              id: 'mem_adr_008',
              type: 'decision',
              summary: 'ADR-008: Abstraction layer',
              confidence: 0.95,
            },
          },
        ],
      }),
    } as any;

    const result = analyzer.analyze('PaymentService', mockQueryEngine, scorer, 1);
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0].entityType).toBe('DECISION');
    expect(result.nodes[0].reasons[0].type).toBe('DECISION_IMPACT');
  });
});
