import { describe, it, expect } from 'vitest';
import { SymbolGraph } from '../models/SymbolGraph.js';
import { GraphNode } from '../models/GraphNode.js';
import { GraphEdge } from '../models/GraphEdge.js';

describe('SymbolGraph Query APIs', () => {
  const loc = { filePath: 'test.ts', startLine: 1, endLine: 5, startColumn: 1, endColumn: 10 };

  const nodeA = new GraphNode({ id: 'sym_A', name: 'callerFn', kind: 'function', language: 'typescript', location: loc });
  const nodeB = new GraphNode({ id: 'sym_B', name: 'calleeFn', kind: 'function', language: 'typescript', location: loc });
  const nodeC = new GraphNode({ id: 'sym_C', name: 'helperFn', kind: 'function', language: 'typescript', location: loc });

  const edgeAB = new GraphEdge({ id: 'e1', fromId: 'sym_A', toId: 'sym_B', type: 'CALLS' });
  const edgeBC = new GraphEdge({ id: 'e2', fromId: 'sym_B', toId: 'sym_C', type: 'CALLS' });

  const graph = new SymbolGraph([nodeA, nodeB, nodeC], [edgeAB, edgeBC]);

  it('should query node by ID', () => {
    expect(graph.getNode('sym_A')?.name).toBe('callerFn');
    expect(graph.getNode('unknown')).toBeUndefined();
  });

  it('should query callers and callees', () => {
    const calleesOfA = graph.findCallees('sym_A');
    expect(calleesOfA).toHaveLength(1);
    expect(calleesOfA[0].id).toBe('sym_B');

    const callersOfB = graph.findCallers('sym_B');
    expect(callersOfB).toHaveLength(1);
    expect(callersOfB[0].id).toBe('sym_A');
  });

  it('should query dependencies and dependents', () => {
    const depsOfB = graph.findDependencies('sym_B');
    expect(depsOfB).toHaveLength(1);
    expect(depsOfB[0].id).toBe('sym_C');

    const dependentsOfB = graph.findDependents('sym_B');
    expect(dependentsOfB).toHaveLength(1);
    expect(dependentsOfB[0].id).toBe('sym_A');
  });
});
