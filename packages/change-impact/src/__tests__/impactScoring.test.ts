import { describe, it, expect } from 'vitest';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

describe('ImpactScorer', () => {
  const scorer = new ImpactScorer();

  it('calculates weighted score clamped between 0.0 and 1.0', () => {
    const score1 = scorer.calculateScore({ directRelationship: 0.9, reverseDependency: 0.8 }, 1);
    const score2 = scorer.calculateScore({ directRelationship: 0.9, reverseDependency: 0.8 }, 3);

    expect(score1).toBeGreaterThan(0.0);
    expect(score1).toBeLessThanOrEqual(1.0);
    expect(score2).toBeLessThan(score1); // distance decay lowers score
  });
});
