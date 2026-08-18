import { describe, it, expect } from 'vitest';
import { DependencyImpactAnalyzer } from '../analyzers/DependencyImpactAnalyzer.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('DependencyImpactAnalyzer (Direct Impact)', () => {
  const analyzer = new DependencyImpactAnalyzer();
  const scorer = new ImpactScorer();

  it('detects DIRECT_DEPENDENCY impact for outgoing graph edges', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 's1', name: 'AuthService', kind: 'class', language: 'typescript', location: { filePath: 'src/auth.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 's2', name: 'UserRepo', kind: 'class', language: 'typescript', location: { filePath: 'src/user.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'e1', fromId: 's1', toId: 's2', type: 'IMPORTS' as any }),
      ]
    );

    const result = analyzer.analyze('s1', graph, scorer, 1);
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0].id).toBe('s2');
    expect(result.nodes[0].reasons[0].type).toBe('DIRECT_DEPENDENCY');
  });
});
