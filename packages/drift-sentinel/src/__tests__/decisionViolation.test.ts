import { describe, it, expect } from 'vitest';
import { DecisionViolationAnalyzer } from '../analyzers/DecisionViolationAnalyzer.js';
import { ArchitecturalBaselineBuilder } from '../baseline/ArchitecturalBaselineBuilder.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';
import { BaseMemory } from '@codememory/memory-engine';

describe('DecisionViolationAnalyzer (ADR Conflict Detection)', () => {
  const analyzer = new DecisionViolationAnalyzer();
  const builder = new ArchitecturalBaselineBuilder();

  it('detects ARCHITECTURAL_DECISION_VIOLATION when code bypasses storage isolation ADR', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 's1', name: 'DirectStorage', kind: 'file', language: 'typescript', location: { filePath: 'packages/core/src/storage.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'u1', name: 'UserLogic', kind: 'file', language: 'typescript', location: { filePath: 'packages/user/src/user.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'e1', fromId: 'u1', toId: 's1', type: 'IMPORTS' as any }),
      ]
    );

    const decisionMemory: BaseMemory = {
      id: 'mem_adr_004',
      type: 'decision',
      summary: 'Storage must remain isolated behind IStoragePort',
      confidence: 1.0,
      importance: 1.0,
      recency: new Date().toISOString(),
      sourceEvents: ['evt_adr'],
      relationships: [],
      metadata: {
        decisionTitle: 'ADR-004: Isolate Storage Port',
        rationale: 'Storage must remain isolated behind IStoragePort',
        boundSymbols: ['packages/core/src/storage.ts'],
      },
    };

    const baseline = builder.build({ symbolGraph: graph, memories: [decisionMemory] });
    const findings = analyzer.analyze(graph, [decisionMemory], baseline);

    expect(findings.length).toBe(1);
    expect(findings[0].type).toBe('ARCHITECTURAL_DECISION_VIOLATION');
    expect(findings[0].relatedDecisions).toContain('mem_adr_004');
  });
});
