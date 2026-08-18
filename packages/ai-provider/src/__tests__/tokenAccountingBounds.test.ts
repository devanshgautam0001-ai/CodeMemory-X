import { describe, it, expect } from 'vitest';
import { DefaultTokenAccounting } from '../resilience/DefaultResilience.js';

describe('DefaultTokenAccounting Memory Bounds Suite', () => {
  it('1. bounds token usage records to 5000 items maximum', () => {
    const accounting = new DefaultTokenAccounting();

    for (let i = 0; i < 5050; i++) {
      accounting.recordUsage('openai', 'gpt-4o', 10, 20);
    }

    const records = accounting.getRecords();
    expect(records.length).toBe(5000);
  });
});
