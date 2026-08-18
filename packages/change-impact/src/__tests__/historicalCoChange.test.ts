import { describe, it, expect } from 'vitest';
import { CoChangeIndex } from '../index/CoChangeIndex.js';
import { HistoricalCoChangeAnalyzer } from '../analyzers/HistoricalCoChangeAnalyzer.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

describe('HistoricalCoChangeAnalyzer & CoChangeIndex', () => {
  const index = new CoChangeIndex();
  const analyzer = new HistoricalCoChangeAnalyzer();
  const scorer = new ImpactScorer();

  it('calculates co-change strength ratio and returns HISTORICAL_COCHANGE impact', () => {
    for (let i = 0; i < 5; i++) {
      index.indexCommit(['src/A.ts', 'src/B.ts']);
    }
    index.indexCommit(['src/A.ts', 'src/C.ts']);

    const strengthAB = index.getCoChangeStrength('src/A.ts', 'src/B.ts');
    expect(strengthAB).toBeGreaterThan(0.70);

    const result = analyzer.analyze('src/A.ts', index, scorer, 1);
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.nodes.some((n) => n.id === 'src/B.ts')).toBe(true);
    expect(result.nodes[0].reasons[0].type).toBe('HISTORICAL_COCHANGE');
  });
});
