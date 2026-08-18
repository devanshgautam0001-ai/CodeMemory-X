import { ILogger } from '@codememory/logging';
import { BaseMemory } from '@codememory/memory-engine';
import { EntityNode, Relationship, GraphPath, EntityType } from '../types/RelationshipTypes.js';
import { DeterministicRuleEvaluator } from '../rules/DeterministicRuleEvaluator.js';

export class RelationshipEngine {
  private nodes: Map<string, EntityNode> = new Map();
  private relationships: Map<string, Relationship> = new Map();
  private adjacency: Map<string, Set<string>> = new Map();
  private evaluator: DeterministicRuleEvaluator;

  constructor(private readonly logger?: ILogger) {
    this.evaluator = new DeterministicRuleEvaluator();
  }

  public addEntity(entity: EntityNode): void {
    this.nodes.set(entity.id, entity);
    if (!this.adjacency.has(entity.id)) {
      this.adjacency.set(entity.id, new Set());
    }
    this.logger?.info(`[RelationshipEngine] Added entity ${entity.id} (${entity.type})`);
  }

  public addRelationship(rel: Relationship): void {
    this.relationships.set(rel.id, rel);

    if (!this.adjacency.has(rel.sourceId)) this.adjacency.set(rel.sourceId, new Set());
    if (!this.adjacency.has(rel.targetId)) this.adjacency.set(rel.targetId, new Set());

    this.adjacency.get(rel.sourceId)!.add(rel.targetId);
    this.adjacency.get(rel.targetId)!.add(rel.sourceId);

    this.logger?.info(`[RelationshipEngine] Added relationship ${rel.type} between ${rel.sourceId} and ${rel.targetId}`);
  }

  public buildFromMemories(memories: BaseMemory[]): void {
    // 1. Index memories as EntityNodes
    memories.forEach((mem) => {
      let entityType: EntityType = 'Memory';
      if (mem.type === 'intent') entityType = 'Intent';
      else if (mem.type === 'decision') entityType = 'Decision';
      else if (mem.type === 'symbol') entityType = 'Symbol';
      else if (mem.type === 'file') entityType = 'File';
      else if (mem.type === 'session') entityType = 'Session';
      else if (mem.type === 'bug') entityType = 'Bug';
      else if (mem.type === 'refactor') entityType = 'Refactor';

      this.addEntity({
        id: mem.id,
        type: entityType,
        label: mem.summary,
        metadata: {
          filePath: (mem as any).filePath,
          symbolName: (mem as any).symbolName,
          sessionId: (mem as any).sessionId,
          status: (mem as any).status,
        },
      });

      // Index explicit relationships
      mem.relationships.forEach((rel) => {
        this.addRelationship({
          id: `rel_${mem.id}_${rel.type}_${rel.targetMemoryId}`,
          sourceId: mem.id,
          targetId: rel.targetMemoryId,
          type: rel.type as any,
          weight: 0.9,
          timestamp: mem.recency,
        });
      });
    });

    // 2. Evaluate all pairs for implicit deterministic linkages
    const nodeList = Array.from(this.nodes.values());
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const implicitRel = this.evaluator.evaluatePair(nodeList[i], nodeList[j]);
        if (implicitRel) {
          this.addRelationship(implicitRel);
        }
      }
    }
  }

  public findRelationships(entityId: string): Relationship[] {
    return Array.from(this.relationships.values()).filter(
      (r) => r.sourceId === entityId || r.targetId === entityId
    );
  }

  public findNeighbors(entityId: string): EntityNode[] {
    const neighborIds = this.adjacency.get(entityId) ?? new Set();
    return Array.from(neighborIds)
      .map((id) => this.nodes.get(id))
      .filter((n): n is EntityNode => n !== undefined);
  }

  public findConnectedEntities(entityId: string, depth = 2): EntityNode[] {
    const visited = new Set<string>();
    const queue: { id: string; d: number }[] = [{ id: entityId, d: 0 }];
    const result: EntityNode[] = [];

    visited.add(entityId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.id !== entityId) {
        const node = this.nodes.get(curr.id);
        if (node) result.push(node);
      }

      if (curr.d < depth) {
        const neighbors = this.adjacency.get(curr.id) ?? new Set();
        for (const nId of neighbors) {
          if (!visited.has(nId)) {
            visited.add(nId);
            queue.push({ id: nId, d: curr.d + 1 });
          }
        }
      }
    }

    return result;
  }

  public findPath(sourceId: string, targetId: string): GraphPath | null {
    if (!this.nodes.has(sourceId) || !this.nodes.has(targetId)) return null;
    if (sourceId === targetId) {
      const n = this.nodes.get(sourceId)!;
      return { nodes: [n], relationships: [], totalWeight: 0 };
    }

    // BFS Shortest Path
    const visited = new Set<string>();
    const parent = new Map<string, { prev: string; rel: Relationship }>();
    const queue: string[] = [sourceId];

    visited.add(sourceId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === targetId) break;

      const rels = this.findRelationships(curr);
      for (const rel of rels) {
        const nextId = rel.sourceId === curr ? rel.targetId : rel.sourceId;
        if (!visited.has(nextId)) {
          visited.add(nextId);
          parent.set(nextId, { prev: curr, rel });
          queue.push(nextId);
        }
      }
    }

    if (!parent.has(targetId)) return null; // No path found

    // Reconstruct path
    const pathNodes: EntityNode[] = [];
    const pathRels: Relationship[] = [];
    let curr = targetId;

    while (curr !== sourceId) {
      const n = this.nodes.get(curr);
      if (n) pathNodes.unshift(n);

      const p = parent.get(curr)!;
      pathRels.unshift(p.rel);
      curr = p.prev;
    }

    pathNodes.unshift(this.nodes.get(sourceId)!);

    const totalWeight = pathRels.reduce((sum, r) => sum + (r.weight ?? 1), 0);

    return {
      nodes: pathNodes,
      relationships: pathRels,
      totalWeight,
    };
  }

  public clear(): void {
    this.nodes.clear();
    this.relationships.clear();
    this.adjacency.clear();
  }
}
