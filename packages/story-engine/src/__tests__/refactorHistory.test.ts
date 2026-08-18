import { describe, it, expect, vi } from 'vitest';
import { RefactorExtractor } from '../extractors/RefactorExtractor.js';

describe('RefactorExtractor', () => {
  const extractor = new RefactorExtractor();

  it('extracts refactor memories related to target file path', () => {
    const mockQueryEngine = {
      search: vi.fn().mockReturnValue({
        items: [
          {
            memory: {
              id: 'mem_ref_001',
              type: 'refactor',
              summary: 'Extracted interface',
              confidence: 0.92,
            },
          },
        ],
      }),
    } as any;

    const refactors = extractor.extractRefactors('sym1', 'src/service.ts', mockQueryEngine);
    expect(refactors.length).toBe(1);
    expect(refactors[0].refactorId).toBe('mem_ref_001');
  });
});
