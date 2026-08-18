import { describe, it, expect } from 'vitest';
import { ContributorExtractor } from '../extractors/ContributorExtractor.js';

describe('ContributorExtractor', () => {
  const extractor = new ContributorExtractor();

  it('calculates deterministic contributor ownership percentages', () => {
    const events = [
      { id: 'e1', payload: { author: 'Alice' } },
      { id: 'e2', payload: { author: 'Alice' } },
      { id: 'e3', payload: { author: 'Bob' } },
    ];

    const contribs = extractor.extractContributors(events);
    expect(contribs.length).toBe(2);
    expect(contribs[0].displayName).toBe('Alice');
    expect(contribs[0].contributionPercentage).toBe(66.7);
  });
});
