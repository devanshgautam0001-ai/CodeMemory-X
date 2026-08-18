import { describe, it, expect } from 'vitest';
import { DependencyDirectionAnalyzer } from '../analyzers/DependencyDirectionAnalyzer.js';
import { ArchitecturalBaselineBuilder } from '../baseline/ArchitecturalBaselineBuilder.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('DependencyDirectionAnalyzer', () => {
  const analyzer = new DependencyDirectionAnalyzer();
  const builder = new ArchitecturalBaselineBuilder();

  it('flags DEPENDENCY_DIRECTION_DRIFT when core imports context-engine', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 'c1', name: 'CoreService', kind: 'class', language: 'typescript', location: { filePath: 'packages/core/src/CoreService.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'cx1', name: 'ContextEngine', kind: 'class', language: 'typescript', location: { filePath: 'packages/context-engine/src/ContextEngine.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'edge1', fromId: 'c1', toId: 'cx1', type: 'IMPORTS' as any }),
      ]
    );

    const baseline = builder.build({ symbolGraph: graph });
    const findings = analyzer.analyze(graph, baseline);

    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('DEPENDENCY_DIRECTION_DRIFT');
    expect(findings[0].affectedPackages).toContain('@codememory/core');
  });

  it('allows valid dependency direction without drift findings', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 'cx1', name: 'ContextEngine', kind: 'class', language: 'typescript', location: { filePath: 'packages/context-engine/src/ContextEngine.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'c1', name: 'CoreService', kind: 'class', language: 'typescript', location: { filePath: 'packages/core/src/CoreService.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'edge1', fromId: 'cx1', toId: 'c1', type: 'IMPORTS' as any }),
      ]
    );

    const baseline = builder.build({ symbolGraph: graph });
    const findings = analyzer.analyze(graph, baseline);

    expect(findings.length).toBe(0);
  });
});
