import { describe, it, expect } from 'vitest';
import { ImpactRepository } from '../repository/ImpactRepository.js';
import { ImpactMap } from '../types/ImpactMap.js';

describe('ImpactRepository Bounds', () => {
  it('should enforce a 500 impact map capacity bound', () => {
    const repo = new ImpactRepository();

    for (let i = 1; i <= 510; i++) {
      const map: ImpactMap = {
        rootId: `root_${i}`,
        rootPath: `file_${i}.ts`,
        nodes: [],
        edges: [],
        summary: {
          totalAffectedFiles: 1,
          totalAffectedSymbols: 0,
          maxDepth: 1,
          highestImpactScore: 0.8,
          architecturalRiskCount: 0,
        },
      };
      repo.save(map);
    }

    expect(repo.getByRootId('root_1')).toBeUndefined();
    expect(repo.getByRootId('root_510')).toBeDefined();
  });
});
