import { SymbolGraph } from '@codememory/symbol-graph';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class InheritanceImpactAnalyzer {
  public analyze(
    symbolId: string,
    graph: SymbolGraph,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const extendsEdges = graph.getEdges(undefined, symbolId, 'EXTENDS' as any);
    const implementsEdges = graph.getEdges(undefined, symbolId, 'IMPLEMENTS' as any);

    const nodesMap = new Map(graph.getAllNodes().map((n) => [n.id, n]));

    for (const edge of extendsEdges) {
      const childNode = nodesMap.get(edge.fromId);
      if (!childNode || childNode.id === symbolId) continue;

      const score = scorer.calculateScore({ directRelationship: 1.0, relationshipStrength: 0.95 }, distance);

      nodes.push({
        id: childNode.id,
        entityType: 'SYMBOL',
        name: childNode.name,
        path: childNode.location.filePath,
        impactScore: score,
        confidence: 0.98,
        reasons: [
          {
            type: 'INHERITANCE_IMPACT',
            sourceId: symbolId,
            description: `Derived class ${childNode.name} inherits from ${symbolId}`,
            strength: 1.0,
            evidenceIds: [edge.id],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_inh_${childNode.id}`,
        sourceId: symbolId,
        targetId: childNode.id,
        type: 'INHERITANCE_IMPACT',
        weight: score,
      });
    }

    for (const edge of implementsEdges) {
      const implNode = nodesMap.get(edge.fromId);
      if (!implNode || implNode.id === symbolId) continue;

      const score = scorer.calculateScore({ directRelationship: 0.95, relationshipStrength: 0.90 }, distance);

      nodes.push({
        id: implNode.id,
        entityType: 'SYMBOL',
        name: implNode.name,
        path: implNode.location.filePath,
        impactScore: score,
        confidence: 0.95,
        reasons: [
          {
            type: 'IMPLEMENTATION_IMPACT',
            sourceId: symbolId,
            description: `Class ${implNode.name} implements interface ${symbolId}`,
            strength: 0.95,
            evidenceIds: [edge.id],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_impl_${implNode.id}`,
        sourceId: symbolId,
        targetId: implNode.id,
        type: 'IMPLEMENTATION_IMPACT',
        weight: score,
      });
    }

    return { nodes, edges };
  }
}
