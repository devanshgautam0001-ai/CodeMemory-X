import { CoChangeIndex } from '../index/CoChangeIndex.js';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class HistoricalCoChangeAnalyzer {
  public analyze(
    filePath: string,
    coChangeIndex: CoChangeIndex,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const coChangedFiles = coChangeIndex.getCoChangedFiles(filePath, 0.2);

    for (const item of coChangedFiles) {
      const score = scorer.calculateScore({ historicalCoChange: item.strength, relationshipStrength: 0.80 }, distance);

      nodes.push({
        id: item.file,
        entityType: 'FILE',
        name: item.file.split('/').pop() ?? item.file,
        path: item.file,
        impactScore: score,
        confidence: Number((0.85 + item.strength * 0.1).toFixed(2)),
        reasons: [
          {
            type: 'HISTORICAL_COCHANGE',
            sourceId: filePath,
            description: `File ${item.file} historically co-changed with ${filePath} (co-change strength: ${(item.strength * 100).toFixed(0)}%)`,
            strength: item.strength,
            evidenceIds: [`cochange_${filePath}_${item.file}`],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_cochange_${filePath}_${item.file}`,
        sourceId: filePath,
        targetId: item.file,
        type: 'HISTORICAL_COCHANGE',
        weight: score,
      });
    }

    return { nodes, edges };
  }
}
