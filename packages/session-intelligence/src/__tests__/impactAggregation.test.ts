import { describe, it, expect, vi } from 'vitest';
import { ImpactAggregator } from '../aggregation/ImpactAggregator.js';

describe('ImpactAggregator', () => {
  const aggregator = new ImpactAggregator();

  it('aggregates change impact summaries across session files', () => {
    const mockImpactEngine = {
      analyzeFile: vi.fn().mockReturnValue({
        rootId: 'src/app.ts',
        totalAffectedEntities: 5,
        nodes: [
          { id: 'src/app.ts', impactScore: 1.0 },
          { id: 'src/service.ts', impactScore: 0.85 },
        ],
        overallImpactScore: 0.85,
        overallConfidence: 0.90,
      }),
    } as any;

    const summary = aggregator.aggregate(['src/app.ts'], mockImpactEngine);
    expect(summary).toBeDefined();
    expect(summary?.totalAffectedEntities).toBe(5);
    expect(summary?.highImpactEntities).toBe(1);
  });
});
