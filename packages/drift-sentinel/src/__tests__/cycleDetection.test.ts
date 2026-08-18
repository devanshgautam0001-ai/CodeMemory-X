import { describe, it, expect } from 'vitest';
import { CycleAnalyzer } from '../analyzers/CycleAnalyzer.js';
import { ArchitecturalBaselineBuilder } from '../baseline/ArchitecturalBaselineBuilder.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('CycleAnalyzer (Cycle Detection)', () => {
  const analyzer = new CycleAnalyzer();
  const builder = new ArchitecturalBaselineBuilder();

  it('detects new cyclic dependency A -> B -> A', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 'a', name: 'ModuleA', kind: 'file', language: 'typescript', location: { filePath: 'packages/a/src/a.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'b', name: 'ModuleB', kind: 'file', language: 'typescript', location: { filePath: 'packages/b/src/b.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'e1', fromId: 'a', toId: 'b', type: 'IMPORTS' as any }),
        new GraphEdge({ id: 'e2', fromId: 'b', toId: 'a', type: 'IMPORTS' as any }),
      ]
    );

    const baseline = builder.build({ symbolGraph: graph });
    const findings = analyzer.analyze(graph, baseline);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('NEW_CYCLIC_DEPENDENCY');
  });
});
