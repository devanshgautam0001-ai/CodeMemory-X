import { describe, it, expect } from 'vitest';
import { HistoricalDeviationAnalyzer } from '../analyzers/HistoricalDeviationAnalyzer.js';
import { ArchitecturalBaselineBuilder } from '../baseline/ArchitecturalBaselineBuilder.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('HistoricalDeviationAnalyzer', () => {
  const analyzer = new HistoricalDeviationAnalyzer();
  const builder = new ArchitecturalBaselineBuilder();

  it('detects SYMBOL_RESPONSIBILITY_DRIFT when call sites exceed baseline', () => {
    const baseGraph = new SymbolGraph(
      [
        new GraphNode({ id: 'sym1', name: 'GlobalBus', kind: 'class', language: 'typescript', location: { filePath: 'packages/event-bus/src/bus.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      []
    );
    const baseline = builder.build({ symbolGraph: baseGraph });

    const nodes = [
      new GraphNode({ id: 'sym1', name: 'GlobalBus', kind: 'class', language: 'typescript', location: { filePath: 'packages/event-bus/src/bus.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
    ];
    const edges = [];
    for (let i = 0; i < 7; i++) {
      nodes.push(new GraphNode({ id: `caller_${i}`, name: `Caller${i}`, kind: 'file', language: 'typescript', location: { filePath: `packages/a/src/caller_${i}.ts`, range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }));
      edges.push(new GraphEdge({ id: `e_${i}`, fromId: `caller_${i}`, toId: 'sym1', type: 'CALLS' as any }));
    }

    const currentGraph = new SymbolGraph(nodes, edges);
    const findings = analyzer.analyze(currentGraph, baseline);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some((f) => f.type === 'SYMBOL_RESPONSIBILITY_DRIFT')).toBe(true);
  });
});
