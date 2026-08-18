import { describe, it, expect } from 'vitest';
import { CallerImpactAnalyzer } from '../analyzers/CallerImpactAnalyzer.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('CallerImpactAnalyzer', () => {
  const analyzer = new CallerImpactAnalyzer();
  const scorer = new ImpactScorer();

  it('detects CALLER_IMPACT for incoming call edges', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 'c1', name: 'login', kind: 'function', language: 'typescript', location: { filePath: 'src/login.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'f1', name: 'validateToken', kind: 'function', language: 'typescript', location: { filePath: 'src/auth.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'e1', fromId: 'c1', toId: 'f1', type: 'CALLS' as any }),
      ]
    );

    const result = analyzer.analyze('f1', graph, scorer, 1);
    expect(result.nodes.length).toBe(1);
    expect(result.nodes[0].id).toBe('c1');
    expect(result.nodes[0].reasons[0].type).toBe('CALLER_IMPACT');
  });
});
