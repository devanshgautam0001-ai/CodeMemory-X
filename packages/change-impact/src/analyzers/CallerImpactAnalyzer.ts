import { SymbolGraph } from '@codememory/symbol-graph';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class CallerImpactAnalyzer {
  public analyze(
    symbolId: string,
    graph: SymbolGraph,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const callers = graph.findCallers(symbolId);
    const callees = graph.findCallees(symbolId);

    for (const caller of callers) {
      if (caller.id === symbolId) continue;
      const score = scorer.calculateScore({ directRelationship: 0.95, reverseDependency: 0.90 }, distance);

      nodes.push({
        id: caller.id,
        entityType: 'SYMBOL',
        name: caller.name,
        path: caller.location.filePath,
        impactScore: score,
        confidence: 0.95,
        reasons: [
          {
            type: 'CALLER_IMPACT',
            sourceId: symbolId,
            description: `Function/Method ${caller.name} calls ${symbolId}`,
            strength: 0.95,
            evidenceIds: [`call_${caller.id}_${symbolId}`],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_caller_${caller.id}`,
        sourceId: symbolId,
        targetId: caller.id,
        type: 'CALLER_IMPACT',
        weight: score,
      });
    }

    for (const callee of callees) {
      if (callee.id === symbolId) continue;
      const score = scorer.calculateScore({ directRelationship: 0.80 }, distance);

      nodes.push({
        id: callee.id,
        entityType: 'SYMBOL',
        name: callee.name,
        path: callee.location.filePath,
        impactScore: score,
        confidence: 0.90,
        reasons: [
          {
            type: 'CALLEE_IMPACT',
            sourceId: symbolId,
            description: `Symbol ${symbolId} calls function/method ${callee.name}`,
            strength: 0.80,
            evidenceIds: [`call_${symbolId}_${callee.id}`],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_callee_${callee.id}`,
        sourceId: symbolId,
        targetId: callee.id,
        type: 'CALLEE_IMPACT',
        weight: score,
      });
    }

    return { nodes, edges };
  }
}
