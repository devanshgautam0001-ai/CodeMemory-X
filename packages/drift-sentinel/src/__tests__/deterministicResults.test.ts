import { describe, it, expect } from 'vitest';
import { DriftSentinel } from '../engine/DriftSentinel.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('DriftSentinel (Deterministic Execution)', () => {
  it('produces identical findings for identical graph inputs', () => {
    const sentinel = new DriftSentinel();

    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 'c1', name: 'CoreService', kind: 'class', language: 'typescript', location: { filePath: 'packages/core/src/CoreService.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'cx1', name: 'ContextEngine', kind: 'class', language: 'typescript', location: { filePath: 'packages/context-engine/src/ContextEngine.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'edge1', fromId: 'c1', toId: 'cx1', type: 'IMPORTS' as any }),
      ]
    );

    const findings1 = sentinel.analyze({ symbolGraph: graph });
    sentinel.clear();
    const findings2 = sentinel.analyze({ symbolGraph: graph });

    expect(findings1.length).toBe(findings2.length);
    expect(findings1[0].id).toBe(findings2[0].id);
    expect(findings1[0].score).toBe(findings2[0].score);
    expect(findings1[0].severity).toBe(findings2[0].severity);
  });

  it('supports finding lookup APIs (by severity, type, file, symbol, package)', () => {
    const sentinel = new DriftSentinel();

    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 'c1', name: 'CoreService', kind: 'class', language: 'typescript', location: { filePath: 'packages/core/src/CoreService.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 'cx1', name: 'ContextEngine', kind: 'class', language: 'typescript', location: { filePath: 'packages/context-engine/src/ContextEngine.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'edge1', fromId: 'c1', toId: 'cx1', type: 'IMPORTS' as any }),
      ]
    );

    const findings = sentinel.analyze({ symbolGraph: graph });
    expect(findings.length).toBeGreaterThan(0);

    const id = findings[0].id;
    expect(sentinel.getFinding(id)).toBeDefined();
    expect(sentinel.getFindingsBySeverity('CRITICAL').length + sentinel.getFindingsBySeverity('HIGH').length + sentinel.getFindingsBySeverity('MEDIUM').length).toBeGreaterThan(0);
    expect(sentinel.getFindingsByType('DEPENDENCY_DIRECTION_DRIFT').length).toBeGreaterThan(0);
    expect(sentinel.getFindingsForFile('packages/core/src/CoreService.ts').length).toBeGreaterThan(0);
    expect(sentinel.getFindingsForPackage('@codememory/core').length).toBeGreaterThan(0);

    const ackRes = sentinel.acknowledgeFinding(id);
    expect(ackRes).toBe(true);
    expect(sentinel.getFinding(id)?.acknowledged).toBe(true);
  });
});
