import { describe, it, expect } from 'vitest';
import { DriftScorer } from '../scoring/DriftScorer.js';
import { SeverityResolver } from '../scoring/SeverityResolver.js';

describe('DriftScorer & SeverityResolver', () => {
  const scorer = new DriftScorer();
  const resolver = new SeverityResolver();

  it('calculates clamped score between 0.0 and 1.0', () => {
    const score = scorer.calculateScore({
      boundaryViolation: 0.90,
      dependencyChange: 0.85,
      decisionConflict: 1.0,
    });

    expect(score).toBeGreaterThan(0.0);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('resolves severity accurately based on score thresholds', () => {
    expect(resolver.resolve(0.85)).toBe('CRITICAL');
    expect(resolver.resolve(0.65)).toBe('HIGH');
    expect(resolver.resolve(0.45)).toBe('MEDIUM');
    expect(resolver.resolve(0.25)).toBe('LOW');
    expect(resolver.resolve(0.10)).toBe('INFO');
  });
});
