import { describe, it, expect } from 'vitest';
import { ChangeImpactEngine } from '../engine/ChangeImpactEngine.js';
import { SymbolGraph, GraphNode, GraphEdge } from '@codememory/symbol-graph';

describe('ChangeImpactEngine (Deterministic Execution)', () => {
  it('produces byte-identical ImpactMap output for identical inputs', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 's1', name: 'AuthService', kind: 'class', language: 'typescript', location: { filePath: 'src/auth.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 's2', name: 'UserRepo', kind: 'class', language: 'typescript', location: { filePath: 'src/user.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'e1', fromId: 's1', toId: 's2', type: 'IMPORTS' as any }),
      ]
    );

    const engine1 = new ChangeImpactEngine({ symbolGraph: graph });
    const engine2 = new ChangeImpactEngine({ symbolGraph: graph });

    const map1 = engine1.analyzeSymbol('s1');
    const map2 = engine2.analyzeSymbol('s1');

    expect(map1.nodes.length).toBe(map2.nodes.length);
    expect(map1.nodes.map((n) => n.id)).toEqual(map2.nodes.map((n) => n.id));
    expect(map1.overallImpactScore).toBe(map2.overallImpactScore);
  });

  it('supports lookup APIs (getAffectedSymbols, getAffectedFiles, getHighImpactEntities)', () => {
    const graph = new SymbolGraph(
      [
        new GraphNode({ id: 's1', name: 'AuthService', kind: 'class', language: 'typescript', location: { filePath: 'src/auth.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
        new GraphNode({ id: 's2', name: 'UserRepo', kind: 'class', language: 'typescript', location: { filePath: 'src/user.ts', range: { start: { line: 1, column: 0 }, end: { line: 5, column: 0 } } } }),
      ],
      [
        new GraphEdge({ id: 'e1', fromId: 's1', toId: 's2', type: 'IMPORTS' as any }),
      ]
    );

    const engine = new ChangeImpactEngine({ symbolGraph: graph });
    engine.analyzeSymbol('s1');

    const map = engine.getImpactMap('s1');
    expect(map).toBeDefined();

    const symbols = engine.getAffectedSymbols('s1');
    expect(symbols.length).toBeGreaterThan(0);

    const highImpact = engine.getHighImpactEntities('s1', 0.50);
    expect(highImpact.length).toBeGreaterThan(0);
  });
});
