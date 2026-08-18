import { describe, it, expect, beforeEach } from 'vitest';
import { RelationshipEngine } from '../engine/RelationshipEngine.js';
import { BaseMemory } from '@codememory/memory-engine';

describe('RelationshipEngine (Deterministic Graph Engine)', () => {
  let engine: RelationshipEngine;

  beforeEach(() => {
    engine = new RelationshipEngine();
  });

  it('indexes entity nodes and explicit relationships correctly', () => {
    const memoryA: BaseMemory = {
      id: 'mem_01',
      type: 'file',
      summary: 'Memory for auth.service.ts',
      confidence: 0.9,
      importance: 0.8,
      recency: new Date().toISOString(),
      sourceEvents: ['evt_1'],
      relationships: [{ targetMemoryId: 'mem_02', type: 'AFFECTS' }],
    };

    const memoryB: BaseMemory = {
      id: 'mem_02',
      type: 'symbol',
      summary: 'Memory for validateToken',
      confidence: 0.95,
      importance: 0.9,
      recency: new Date().toISOString(),
      sourceEvents: ['evt_2'],
      relationships: [],
    };

    engine.buildFromMemories([memoryA, memoryB]);

    const neighbors = engine.findNeighbors('mem_01');
    expect(neighbors.length).toBe(1);
    expect(neighbors[0].id).toBe('mem_02');
  });

  it('evaluates implicit deterministic linkages between entities sharing session or file', () => {
    engine.addEntity({
      id: 'intent_1',
      type: 'Intent',
      label: 'Bug Fix in auth.ts',
      metadata: { filePath: 'src/auth.ts', sessionId: 'sess_100' },
    });

    engine.addEntity({
      id: 'dec_1',
      type: 'Decision',
      label: 'ADR: Token Expiration Policy',
      metadata: { filePath: 'src/auth.ts', sessionId: 'sess_100' },
    });

    engine.buildFromMemories([]);

    const rels = engine.findRelationships('intent_1');
    expect(rels.length).toBeGreaterThan(0);
    expect(rels.some((r) => r.type === 'BELONGS_TO' || r.type === 'AFFECTS')).toBe(true);
  });

  it('finds shortest path between two distant entities using BFS', () => {
    engine.addEntity({ id: 'N1', type: 'File', label: 'file1.ts' });
    engine.addEntity({ id: 'N2', type: 'Symbol', label: 'funcA' });
    engine.addEntity({ id: 'N3', type: 'Decision', label: 'ADR 1' });
    engine.addEntity({ id: 'N4', type: 'Intent', label: 'Refactor' });

    engine.addRelationship({ id: 'r1', sourceId: 'N1', targetId: 'N2', type: 'USES' });
    engine.addRelationship({ id: 'r2', sourceId: 'N2', targetId: 'N3', type: 'BOUND_TO' as any });
    engine.addRelationship({ id: 'r3', sourceId: 'N3', targetId: 'N4', type: 'AFFECTS' });

    const path = engine.findPath('N1', 'N4');
    expect(path).not.toBeNull();
    expect(path?.nodes.length).toBe(4);
    expect(path?.nodes[0].id).toBe('N1');
    expect(path?.nodes[3].id).toBe('N4');
  });

  it('traverses connected entities up to specified depth', () => {
    engine.addEntity({ id: 'A', type: 'Session', label: 'S1' });
    engine.addEntity({ id: 'B', type: 'File', label: 'f1.ts' });
    engine.addEntity({ id: 'C', type: 'Symbol', label: 's1' });

    engine.addRelationship({ id: 'r1', sourceId: 'A', targetId: 'B', type: 'BELONGS_TO' });
    engine.addRelationship({ id: 'r2', sourceId: 'B', targetId: 'C', type: 'USES' });

    const depth1 = engine.findConnectedEntities('A', 1);
    expect(depth1.length).toBe(1);
    expect(depth1[0].id).toBe('B');

    const depth2 = engine.findConnectedEntities('A', 2);
    expect(depth2.length).toBe(2);
  });
});
