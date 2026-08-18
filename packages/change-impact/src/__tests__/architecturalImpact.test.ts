import { describe, it, expect } from 'vitest';
import { ArchitecturalImpactAnalyzer } from '../analyzers/ArchitecturalImpactAnalyzer.js';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { ImpactScorer } from '../scoring/ImpactScorer.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('ArchitecturalImpactAnalyzer', () => {
  const analyzer = new ArchitecturalImpactAnalyzer();
  const scorer = new ImpactScorer();
  const sentinel = new DriftSentinel();

  it('surfaces ARCHITECTURAL_IMPACT when target path has drift findings', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 'c1', name: 'CoreService', kind: 'class', language: 'typescript', location: { filePath: 'packages/core/src/CoreService.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'cx1', name: 'ContextEngine', kind: 'class', language: 'typescript', location: { filePath: 'packages/context-engine/src/ContextEngine.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'edge1', fromId: 'c1', toId: 'cx1', type: 'IMPORTS' as any }),
      ]
    );

    sentinel.analyze({ symbolGraph: graph });

    const result = analyzer.analyze('packages/core/src/CoreService.ts', sentinel, scorer, 1);
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.nodes[0].reasons[0].type).toBe('ARCHITECTURAL_IMPACT');
  });
});
