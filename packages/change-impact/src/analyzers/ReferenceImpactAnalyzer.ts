import { SymbolGraph } from '@codememory/symbol-graph';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class ReferenceImpactAnalyzer {
  public analyze(
    symbolId: string,
    graph: SymbolGraph,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const refEdges = graph.getEdges(undefined, symbolId, 'REFERENCES' as any);
    const nodesMap = new Map(graph.getAllNodes().map((n) => [n.id, n]));

    for (const edge of refEdges) {
      const srcNode = nodesMap.get(edge.fromId);
      if (!srcNode || srcNode.id === symbolId) continue;

      const score = scorer.calculateScore({ directRelationship: 0.85, relationshipStrength: 0.80 }, distance);

      nodes.push({
        id: srcNode.id,
        entityType: 'SYMBOL',
        name: srcNode.name,
        path: srcNode.location.filePath,
        impactScore: score,
        confidence: 0.90,
        reasons: [
          {
            type: 'REFERENCE_IMPACT',
            sourceId: symbolId,
            description: `Symbol ${srcNode.name} references ${symbolId}`,
            strength: 0.85,
            evidenceIds: [edge.id],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_ref_${srcNode.id}`,
        sourceId: symbolId,
        targetId: srcNode.id,
        type: 'REFERENCE_IMPACT',
        weight: score,
      });
    }

    return { nodes, edges };
  }
}
