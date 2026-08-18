import { describe, it, expect } from 'vitest';
import { StoryRepository } from '../repository/StoryRepository.js';
import { SymbolStory } from '../types/SymbolStory.js';

describe('StoryRepository Bounds', () => {
  it('should enforce a 1,000 item capacity bound on storiesBySymbolId', () => {
    const repo = new StoryRepository();

    for (let i = 1; i <= 1005; i++) {
      const story: SymbolStory = {
        symbolId: `sym_${i}`,
        name: `Symbol_${i}`,
        kind: 'function',
        language: 'typescript',
        filePath: `src/file_${i}.ts`,
        birth: {
          creationCommit: 'c1',
          author: 'dev',
          firstObservedAt: new Date().toISOString(),
          rationale: 'created',
        },
        milestones: [],
        contributors: [],
        decisions: [],
        bugs: [],
        dependencies: [],
        metrics: {
          editCount: 1,
          contributorCount: 1,
          decisionCount: 0,
          bugCount: 0,
          cyclomaticComplexity: 1,
          cognitiveDebtScore: 0.1,
          stabilityIndex: 0.9,
          coChangeCouplingCount: 0,
        },
      };
      repo.save(story);
    }

    // Oldest items (e.g. sym_1, sym_2, etc.) should have been evicted
    expect(repo.getBySymbolId('sym_1')).toBeUndefined();
    expect(repo.getBySymbolId('sym_2')).toBeUndefined();
    expect(repo.getBySymbolId('sym_1005')).toBeDefined();
  });
});
