import { describe, it, expect } from 'vitest';
import { IntentAggregator } from '../aggregation/IntentAggregator.js';

describe('IntentAggregator', () => {
  const aggregator = new IntentAggregator();

  it('identifies dominant intent type across session intent events', () => {
    const intents = [
      { intentId: 'i1', type: 'Bug Fix', description: 'FIXME', confidence: 0.9, evidenceEventIds: [], observedAt: '' },
      { intentId: 'i2', type: 'Refactor', description: 'REFACTOR', confidence: 0.95, evidenceEventIds: [], observedAt: '' },
      { intentId: 'i3', type: 'Refactor', description: 'REFACTOR 2', confidence: 0.95, evidenceEventIds: [], observedAt: '' },
    ];

    const result = aggregator.aggregate(intents);
    expect(result.dominantIntent).toBe('Refactor');
    expect(result.intents.length).toBe(3);
  });
});
