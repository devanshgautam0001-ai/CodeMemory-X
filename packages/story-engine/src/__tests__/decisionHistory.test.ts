import { describe, it, expect, vi } from 'vitest';
import { DecisionExtractor } from '../extractors/DecisionExtractor.js';

describe('DecisionExtractor', () => {
  const extractor = new DecisionExtractor();

  it('extracts ADR decisions related to target file path', () => {
    const mockQueryEngine = {
      search: vi.fn().mockReturnValue({
        items: [
          {
            memory: {
              id: 'mem_adr_001',
              type: 'decision',
              summary: 'ADR-001: Isolated Port',
              confidence: 0.95,
            },
          },
        ],
      }),
    } as any;

    const decisions = extractor.extractDecisions('sym1', 'src/storage.ts', mockQueryEngine);
    expect(decisions.length).toBe(1);
    expect(decisions[0].decisionId).toBe('mem_adr_001');
  });
});
