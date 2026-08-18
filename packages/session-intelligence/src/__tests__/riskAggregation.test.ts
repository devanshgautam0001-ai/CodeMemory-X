import { describe, it, expect, vi } from 'vitest';
import { RiskAggregator } from '../aggregation/RiskAggregator.js';

describe('RiskAggregator', () => {
  const aggregator = new RiskAggregator();

  it('aggregates architectural drift risks for active session files', () => {
    const mockDriftSentinel = {
      getFindingsForFile: vi.fn().mockReturnValue([
        {
          id: 'drift_01',
          type: 'DEPENDENCY_DIRECTION_DRIFT',
          severity: 'HIGH',
          title: 'Illegal Dependency',
          summary: 'core imports context-engine',
        },
      ]),
    } as any;

    const risks = aggregator.aggregate(['packages/core/src/service.ts'], mockDriftSentinel);
    expect(risks.length).toBe(1);
    expect(risks[0].severity).toBe('HIGH');
  });
});
