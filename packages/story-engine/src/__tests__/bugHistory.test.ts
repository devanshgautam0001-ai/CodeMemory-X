import { describe, it, expect, vi } from 'vitest';
import { BugExtractor } from '../extractors/BugExtractor.js';

describe('BugExtractor', () => {
  const extractor = new BugExtractor();

  it('extracts bug memories related to target file path', () => {
    const mockQueryEngine = {
      search: vi.fn().mockReturnValue({
        items: [
          {
            memory: {
              id: 'mem_bug_001',
              type: 'bug',
              summary: 'Fixed null pointer exception',
              confidence: 0.90,
            },
          },
        ],
      }),
    } as any;

    const bugs = extractor.extractBugs('sym1', 'src/auth.ts', mockQueryEngine);
    expect(bugs.length).toBe(1);
    expect(bugs[0].bugId).toBe('mem_bug_001');
  });
});
