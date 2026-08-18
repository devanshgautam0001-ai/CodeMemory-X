import { describe, it, expect, vi } from 'vitest';
import { RiskContextProvider } from '../context/RiskContextProvider.js';
import { DriftSentinel } from '@codememory/drift-sentinel';

describe('RiskContextProvider Unit Tests', () => {
  it('retrieves architectural drift sentinel findings', async () => {
    const mockDrift = {
      analyze: vi.fn().mockReturnValue([{ id: 'drift_1', severity: 'HIGH' }]),
    } as unknown as DriftSentinel;

    const provider = new RiskContextProvider(mockDrift);
    const findings = await provider.getRiskFindings({ requestId: 'r1', prompt: 'check risks' });

    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe('drift_1');
  });

  it('handles missing driftSentinel or exception gracefully', async () => {
    const providerEmpty = new RiskContextProvider(undefined);
    expect(await providerEmpty.getRiskFindings({ requestId: 'r2', prompt: 'hi' })).toEqual([]);

    const mockThrowing = {
      analyze: vi.fn().mockImplementation(() => { throw new Error('Drift error'); }),
    } as unknown as DriftSentinel;
    const providerThrowing = new RiskContextProvider(mockThrowing);
    expect(await providerThrowing.getRiskFindings({ requestId: 'r3', prompt: 'hi' })).toEqual([]);
  });
});
