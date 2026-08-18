import { describe, it, expect } from 'vitest';
import { normalizeAnalyticsFilter, MAX_ANALYTICS_RANGE_MS } from '../utils/normalizeAnalyticsFilter.js';

describe('normalizeAnalyticsFilter Unbounded fromTimestamp Suite', () => {
  it('1. clamps fromTimestamp when >30 days in the past and toTimestamp is undefined', () => {
    const sixtyDaysAgo = Date.now() - 60 * 86_400_000;
    const normalized = normalizeAnalyticsFilter({ fromTimestamp: sixtyDaysAgo });

    expect(normalized.fromTimestamp).toBeDefined();
    const ageMs = Date.now() - normalized.fromTimestamp!;
    expect(ageMs).toBeLessThanOrEqual(MAX_ANALYTICS_RANGE_MS + 1000);
  });
});
