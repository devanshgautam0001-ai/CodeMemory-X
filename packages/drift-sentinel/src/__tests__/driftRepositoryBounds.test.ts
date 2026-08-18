import { describe, it, expect } from 'vitest';
import { DriftRepository } from '../repository/DriftRepository.js';
import { DriftFinding } from '../types/DriftFinding.js';

describe('DriftRepository Bounds', () => {
  it('should enforce a 500 finding capacity bound', () => {
    const repo = new DriftRepository();

    for (let i = 1; i <= 510; i++) {
      const finding: DriftFinding = {
        id: `drift_${i}`,
        type: 'COUPLING_INCREASE',
        severity: 'LOW',
        title: `Drift ${i}`,
        description: `Description ${i}`,
        score: 0.2,
        confidence: 0.9,
        detectedAt: new Date().toISOString(),
        affectedFiles: [`file_${i}.ts`],
        affectedSymbols: [],
        affectedPackages: [],
      };
      repo.save(finding);
    }

    expect(repo.getById('drift_1')).toBeUndefined();
    expect(repo.getById('drift_510')).toBeDefined();
  });
});
