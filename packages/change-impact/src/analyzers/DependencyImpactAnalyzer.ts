import { SymbolGraph } from '@codememory/symbol-graph';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class DependencyImpactAnalyzer {
  public analyze(
    symbolId: string,
    graph: SymbolGraph,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const outgoing = graph.getEdges(symbolId, undefined);
    const incoming = graph.getEdges(undefined, symbolId);

    const nodesMap = new Map(graph.getAllNodes().map((n) => [n.id, n]));

    // Direct dependencies (outgoing)
    for (const edge of outgoing) {
      const tgtNode = nodesMap.get(edge.toId);
      if (!tgtNode || tgtNode.id === symbolId) continue;

      const score = scorer.calculateScore({ directRelationship: 0.90, relationshipStrength: 0.85 }, distance);

      nodes.push({
        id: tgtNode.id,
        entityType: 'SYMBOL',
        name: tgtNode.name,
        path: tgtNode.location.filePath,
        impactScore: score,
        confidence: 0.95,
        reasons: [
          {
            type: 'DIRECT_DEPENDENCY',
            sourceId: symbolId,
            description: `Direct dependency from ${symbolId} to ${tgtNode.name}`,
            strength: 0.90,
            evidenceIds: [edge.id],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_${symbolId}_${tgtNode.id}`,
        sourceId: symbolId,
        targetId: tgtNode.id,
        type: 'DIRECT_DEPENDENCY',
        weight: score,
      });
    }

    // Reverse dependencies (incoming)
    for (const edge of incoming) {
      const srcNode = nodesMap.get(edge.fromId);
      if (!srcNode || srcNode.id === symbolId) continue;

      const score = scorer.calculateScore({ reverseDependency: 0.95, relationshipStrength: 0.90 }, distance);

      nodes.push({
        id: srcNode.id,
        entityType: 'SYMBOL',
        name: srcNode.name,
        path: srcNode.location.filePath,
        impactScore: score,
        confidence: 0.95,
        reasons: [
          {
            type: 'REVERSE_DEPENDENCY',
            sourceId: symbolId,
            description: `Reverse dependency: ${srcNode.name} depends on ${symbolId}`,
            strength: 0.95,
            evidenceIds: [edge.id],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_${srcNode.id}_${symbolId}`,
        sourceId: symbolId,
        targetId: srcNode.id,
        type: 'REVERSE_DEPENDENCY',
        weight: score,
      });
    }

    return { nodes, edges };
  }
}
