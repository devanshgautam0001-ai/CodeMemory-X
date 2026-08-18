import { describe, it, expect } from 'vitest';
import { CouplingAnalyzer } from '../analyzers/CouplingAnalyzer.js';
import { ArchitecturalBaselineBuilder } from '../baseline/ArchitecturalBaselineBuilder.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('CouplingAnalyzer (Coupling Increase Detection)', () => {
  const analyzer = new CouplingAnalyzer();
  const builder = new ArchitecturalBaselineBuilder();

  it('detects coupling escalation when edges increase significantly', () => {
    const baseGraph = new SymbolGraph(
      [
        new GraphNode({ id: 'm1', name: 'Service', kind: 'file', language: 'typescript', location: { filePath: 'packages/a/src/service.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      []
    );
    const baseline = builder.build({ symbolGraph: baseGraph });

    const nodes = [
      new GraphNode({ id: 'm1', name: 'Service', kind: 'file', language: 'typescript', location: { filePath: 'packages/a/src/service.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
    ];
    const edges = [];
    for (let i = 0; i < 6; i++) {
      nodes.push(new GraphNode({ id: `dep_${i}`, name: `Dep${i}`, kind: 'file', language: 'typescript', location: { filePath: `packages/b/src/dep_${i}.ts`, range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }));
      edges.push(new GraphEdge({ id: `e_${i}`, fromId: `dep_${i}`, toId: 'm1', type: 'IMPORTS' as any }));
    }

    const currentGraph = new SymbolGraph(nodes, edges);
    const findings = analyzer.analyze(currentGraph, baseline);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].type).toBe('COUPLING_INCREASE');
  });
});
