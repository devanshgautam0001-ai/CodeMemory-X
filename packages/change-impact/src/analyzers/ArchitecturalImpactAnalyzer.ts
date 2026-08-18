import { DriftSentinel } from '@codememory/drift-sentinel';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class ArchitecturalImpactAnalyzer {
  public analyze(
    targetPathOrPackage: string,
    driftSentinel: DriftSentinel,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const fileFindings = driftSentinel.getFindingsForFile(targetPathOrPackage);
    const packageFindings = driftSentinel.getFindingsForPackage(targetPathOrPackage);

    const allFindings = [...fileFindings, ...packageFindings];

    for (const finding of allFindings) {
      const score = scorer.calculateScore({ architecturalRelevance: 0.95, relationshipStrength: 0.90 }, distance);

      nodes.push({
        id: finding.id,
        entityType: 'PACKAGE',
        name: finding.title,
        path: targetPathOrPackage,
        impactScore: score,
        confidence: finding.confidence,
        reasons: [
          {
            type: 'ARCHITECTURAL_IMPACT',
            sourceId: targetPathOrPackage,
            description: `Architectural Drift Sentinel (${finding.severity}): ${finding.summary}`,
            strength: finding.score,
            evidenceIds: [finding.id],
          },
        ],
        distance,
      });

      edges.push({
        id: `imp_edge_arch_${targetPathOrPackage}_${finding.id}`,
        sourceId: targetPathOrPackage,
        targetId: finding.id,
        type: 'ARCHITECTURAL_IMPACT',
        weight: score,
      });
    }

    return { nodes, edges };
  }
}
