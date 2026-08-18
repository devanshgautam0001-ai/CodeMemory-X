import { MemoryQueryEngine } from '@codememory/memory-query';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactType } from '../types/ImpactTypes.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class MemoryImpactAnalyzer {
  public analyze(
    targetPathOrSymbol: string,
    memoryQueryEngine: MemoryQueryEngine,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const searchResults = memoryQueryEngine.search({ query: targetPathOrSymbol });

    for (const item of searchResults.items) {
      const mem = item.memory;
      let impactType: ImpactType = 'DECISION_IMPACT';
      let entityType: any = 'DECISION';

      if (mem.type === 'bug') {
        impactType = 'BUG_IMPACT';
        entityType = 'BUG';
      } else if (mem.type === 'refactor') {
        impactType = 'REFACTOR_IMPACT';
        entityType = 'REFACTOR';
      } else if (mem.type === 'decision') {
        impactType = 'DECISION_IMPACT';
        entityType = 'DECISION';
      }

      const score = scorer.calculateScore({ memoryRelevance: 0.90, relationshipStrength: 0.85 }, distance);

      nodes.push({
        id: mem.id,
        entityType,
        name: (mem as any).decisionTitle ?? mem.summary,
        path: targetPathOrSymbol,
        impactScore: score,
        confidence: mem.confidence ?? 0.90,
        reasons: [
          {
            type: impactType,
            sourceId: targetPathOrSymbol,
            description: `Cognitive Memory (${mem.type}): ${mem.summary}`,
            strength: 0.90,
            evidenceIds: [mem.id],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_mem_${targetPathOrSymbol}_${mem.id}`,
        sourceId: targetPathOrSymbol,
        targetId: mem.id,
        type: impactType,
        weight: score,
      });
    }

    return { nodes, edges };
  }
}
