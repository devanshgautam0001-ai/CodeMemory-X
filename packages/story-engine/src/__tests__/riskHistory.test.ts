import { describe, it, expect, vi } from 'vitest';
import { RiskHistoryExtractor } from '../extractors/RiskHistoryExtractor.js';

describe('RiskHistoryExtractor', () => {
  const extractor = new RiskHistoryExtractor();

  it('extracts risk history points from DriftSentinel findings', () => {
    const mockDriftSentinel = {
      getFindingsForFile: vi.fn().mockReturnValue([
        { id: 'f1', score: 0.85, title: 'Boundary Bypass' },
      ]),
    } as any;

    const risks = extractor.extractRiskHistory('src/core.ts', mockDriftSentinel);
    expect(risks.length).toBe(1);
    expect(risks[0].riskScore).toBe(0.85);
  });
});
