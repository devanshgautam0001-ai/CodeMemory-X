import { describe, it, expect } from 'vitest';
import { DependencyExtractor } from '../extractors/DependencyExtractor.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('DependencyExtractor', () => {
  const extractor = new DependencyExtractor();

  it('extracts active dependencies from SymbolGraph', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 's1', name: 'AuthService', kind: 'class', language: 'typescript', location: { filePath: 'a.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 's2', name: 'UserRepo', kind: 'class', language: 'typescript', location: { filePath: 'b.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'e1', fromId: 's1', toId: 's2', type: 'IMPORTS' as any }),
      ]
    );

    const deps = extractor.extractDependencies('s1', graph);
    expect(deps.length).toBe(1);
    expect(deps[0].targetId).toBe('s2');
  });
});
