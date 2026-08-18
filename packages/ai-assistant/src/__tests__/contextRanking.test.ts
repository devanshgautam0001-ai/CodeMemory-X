import { describe, it, expect } from 'vitest';
import { ContextRanker } from '../context/ContextRanker.js';

describe('ContextRanker Priority & Score Deterministic Unit Tests', () => {
  it('ranks context items using priority, relevance score, confidence, and stable ID tie-breaking', () => {
    const items = [
      { id: 'm1', title: 'Low priority item', content: 'Random background details', confidence: 0.5 },
      { id: 'm2', title: 'Active Symbol Story', symbolName: 'AuthService', content: 'Auth logic', confidence: 0.95 },
      { id: 'm3', title: 'Active File Memory', filePath: 'src/auth/AuthService.ts', content: 'File details', confidence: 0.9 },
      { id: 'm4', title: 'High Architectural Risk', type: 'drift', severity: 'high', confidence: 0.99 },
    ];

    const request = {
      requestId: 'req_1',
      prompt: 'How does authentication work in AuthService?',
      activeSymbolName: 'AuthService',
      activeFilePath: 'src/auth/AuthService.ts',
    };

    const res = ContextRanker.rankItems(items, request);

    expect(res.rankedItems).toHaveLength(4);

    // m4 (Architectural Risk: CRITICAL) and m2 (Symbol Match + Score >= 4.0: CRITICAL) are CRITICAL priority
    expect(res.itemScores['m4'].priority).toBe('CRITICAL');
    expect(res.itemScores['m2'].priority).toBe('CRITICAL');

    // m3 (Active File Match: HIGH) is HIGH priority
    expect(res.itemScores['m3'].priority).toBe('HIGH');

    // m1 (Low confidence background item: LOW) is LOW priority
    expect(res.itemScores['m1'].priority).toBe('LOW');

    // CRITICAL items (m2 with score 7.45, m4 with score 3.49) come before HIGH (m3) and LOW (m1)
    expect(res.rankedItems[0].id).toBe('m2');
    expect(res.rankedItems[1].id).toBe('m4');
    expect(res.rankedItems[2].id).toBe('m3');
    expect(res.rankedItems[3].id).toBe('m1');
  });
});
