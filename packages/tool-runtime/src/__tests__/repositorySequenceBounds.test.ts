import { describe, it, expect } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';

describe('ToolExecutionRepository Request Sequence Bounds Suite', () => {
  it('1. bounds requestSequences map size to 5,000 items maximum', () => {
    const repo = new ToolExecutionRepository();

    for (let i = 0; i < 5050; i++) {
      repo.nextSequence(`req_${i}`);
    }

    const mapSize = (repo as any).requestSequences.size;
    expect(mapSize).toBe(5000);
    // Oldest key req_0 should be evicted
    expect((repo as any).requestSequences.has('req_0')).toBe(false);
    expect((repo as any).requestSequences.has('req_5049')).toBe(true);
  });
});
