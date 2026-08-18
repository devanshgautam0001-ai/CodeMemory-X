import { describe, it, expect } from 'vitest';
import { DistanceDecay } from '../scoring/DistanceDecay.js';

describe('DistanceDecay', () => {
  const decay = new DistanceDecay();

  it('evaluates exact distance decay factors', () => {
    expect(decay.getFactor(0)).toBe(1.00);
    expect(decay.getFactor(1)).toBe(0.85);
    expect(decay.getFactor(2)).toBe(0.65);
    expect(decay.getFactor(3)).toBe(0.45);
    expect(decay.getFactor(4)).toBe(0.25);
    expect(decay.getFactor(10)).toBe(0.25);
  });
});
