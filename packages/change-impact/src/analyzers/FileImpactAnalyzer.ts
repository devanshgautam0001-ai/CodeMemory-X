import { SymbolGraph } from '@codememory/symbol-graph';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ImpactScorer } from '../scoring/ImpactScorer.js';

export class FileImpactAnalyzer {
  public analyze(
    filePath: string,
    graph: SymbolGraph,
    scorer: ImpactScorer,
    distance = 1
  ): { nodes: ImpactNode[]; edges: ImpactEdge[] } {
    const nodes: ImpactNode[] = [];
    const edges: ImpactEdge[] = [];

    const fileNodes = graph.getAllNodes().filter((n) => n.location.filePath === filePath);
    const nodeIdsInFile = new Set(fileNodes.map((n) => n.id));

    // Find all external symbols calling into or imported by symbols in this file
    for (const edge of graph.getAllEdges()) {
      const isFromInFile = nodeIdsInFile.has(edge.fromId);
      const isToInFile = nodeIdsInFile.has(edge.toId);

      if (isFromInFile !== isToInFile) {
        const externalNodeId = isFromInFile ? edge.toId : edge.fromId;
        const externalNode = graph.getNode(externalNodeId);

        if (externalNode && externalNode.location.filePath !== filePath) {
          const score = scorer.calculateScore({ directRelationship: 0.85, reverseDependency: 0.80 }, distance);

          nodes.push({
            id: externalNode.location.filePath,
            entityType: 'FILE',
            name: externalNode.location.filePath.split('/').pop() ?? externalNode.location.filePath,
            path: externalNode.location.filePath,
            impactScore: score,
            confidence: 0.90,
            reasons: [
              {
                type: 'FILE_IMPACT',
                sourceId: filePath,
                description: `File ${externalNode.location.filePath} has import/call connection with ${filePath}`,
                strength: 0.85,
                evidenceIds: [edge.id],
              },
            ],
            distance,
          });

          edges.push({
            id: `imp_edge_file_${filePath}_${externalNode.location.filePath}`,
            sourceId: filePath,
            targetId: externalNode.location.filePath,
            type: 'FILE_IMPACT',
            weight: score,
          });
        }
      }
    }

    return { nodes, edges };
  }
}
