import { EntityNode, Relationship, RelationshipType } from '../types/RelationshipTypes.js';

export class DeterministicRuleEvaluator {
  public evaluatePair(nodeA: EntityNode, nodeB: EntityNode): Relationship | null {
    if (nodeA.id === nodeB.id) return null;

    const metaA = nodeA.metadata ?? {};
    const metaB = nodeB.metadata ?? {};

    // Rule 1: Same Session -> BELONGS_TO
    if (metaA.sessionId && metaA.sessionId === metaB.sessionId) {
      return this.createRelationship(nodeA.id, nodeB.id, 'BELONGS_TO', 0.9);
    }

    // Rule 2: Same File -> AFFECTS
    if (metaA.filePath && metaA.filePath === metaB.filePath) {
      return this.createRelationship(nodeA.id, nodeB.id, 'AFFECTS', 0.85);
    }

    // Rule 3: Same Symbol -> USES / REFERENCES
    if (metaA.symbolName && metaA.symbolName === metaB.symbolName) {
      const type: RelationshipType = nodeA.type === 'Symbol' ? 'REFERENCES' : 'USES';
      return this.createRelationship(nodeA.id, nodeB.id, type, 0.95);
    }

    // Rule 4: Decision superseding ADR -> SUPERSEDES
    if (nodeA.type === 'Decision' && nodeB.type === 'Decision') {
      if (metaA.supersededDecisionId === nodeB.id || metaB.supersededDecisionId === nodeA.id) {
        return this.createRelationship(nodeA.id, nodeB.id, 'SUPERSEDES', 1.0);
      }
    }

    // Rule 5: Bug touching Symbol / File -> CAUSED_BY / RESOLVES / AFFECTS
    if (nodeA.type === 'Bug' || nodeB.type === 'Bug') {
      const bugNode = nodeA.type === 'Bug' ? nodeA : nodeB;
      const targetNode = nodeA.type === 'Bug' ? nodeB : nodeA;
      const bugMeta = bugNode.metadata ?? {};
      const targetMeta = targetNode.metadata ?? {};

      if (
        (bugMeta.resolvedSymbol && bugMeta.resolvedSymbol === targetMeta.symbolName) ||
        (bugMeta.filePath && bugMeta.filePath === targetMeta.filePath)
      ) {
        const type: RelationshipType = bugMeta.status === 'resolved' ? 'RESOLVES' : 'CAUSED_BY';
        return this.createRelationship(bugNode.id, targetNode.id, type, 0.92);
      }
    }

    // Rule 6: Refactor modifying File -> RENAMES / MOVES / AFFECTS
    if (nodeA.type === 'Refactor' || nodeB.type === 'Refactor') {
      const refNode = nodeA.type === 'Refactor' ? nodeA : nodeB;
      const targetNode = nodeA.type === 'Refactor' ? nodeB : nodeA;
      const refMeta = refNode.metadata ?? {};
      const targetMeta = targetNode.metadata ?? {};

      if (refMeta.oldFilePath && targetMeta.filePath === refMeta.oldFilePath) {
        return this.createRelationship(refNode.id, targetNode.id, 'RENAMES', 0.95);
      }
      if (refMeta.filePath && targetMeta.filePath === refMeta.filePath) {
        return this.createRelationship(refNode.id, targetNode.id, 'AFFECTS', 0.90);
      }
    }

    // Fallback: General RELATED_TO if sharing any common tags / workspace
    if (metaA.workspace && metaA.workspace === metaB.workspace) {
      return this.createRelationship(nodeA.id, nodeB.id, 'RELATED_TO', 0.5);
    }

    return null;
  }

  private createRelationship(
    sourceId: string,
    targetId: string,
    type: RelationshipType,
    weight: number
  ): Relationship {
    return {
      id: `rel_${sourceId}_${type}_${targetId}`,
      sourceId,
      targetId,
      type,
      weight,
      timestamp: new Date().toISOString(),
    };
  }
}
