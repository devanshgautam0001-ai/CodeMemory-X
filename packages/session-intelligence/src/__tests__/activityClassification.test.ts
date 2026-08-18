import { describe, it, expect } from 'vitest';
import { ActivityClassifier } from '../classification/ActivityClassifier.js';

describe('ActivityClassifier', () => {
  const classifier = new ActivityClassifier();

  it('classifies IDLE, LOW, ACTIVE, and HIGH deterministically', () => {
    const tNow = '2026-08-09T12:00:00.000Z';
    const tRecent = '2026-08-09T11:58:00.000Z';
    const tOld = '2026-08-09T11:20:00.000Z';

    expect(classifier.classify(tOld, 15, tNow)).toBe('IDLE');
    expect(classifier.classify(tRecent, 1, tNow)).toBe('LOW');
    expect(classifier.classify(tRecent, 5, tNow)).toBe('ACTIVE');
    expect(classifier.classify(tRecent, 15, tNow)).toBe('HIGH');
  });
});
