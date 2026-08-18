import { describe, it, expect } from 'vitest';
import { ContextRanker } from '../context/ContextRanker.js';

describe('ContextRanker Determinism & Invalid Date Safeguard Suite', () => {
  it('1. ranks items deterministically when items contain malformed date strings', () => {
    const items = [
      { id: 'item_01', title: 'File A', updatedAt: 'INVALID_DATE' },
      { id: 'item_02', title: 'File B', updatedAt: new Date().toISOString() },
      { id: 'item_03', title: 'File C', updatedAt: 'ALSO_INVALID' },
    ];

    const result = ContextRanker.rankItems(items, { prompt: 'File A' });

    expect(result.rankedItems).toBeDefined();
    expect(result.rankedItems.length).toBe(3);
    // Deterministic order maintained without NaN comparator breakage
    expect(result.rankedItems[0].id).toBe('item_01'); // Direct title match in prompt
  });
});
