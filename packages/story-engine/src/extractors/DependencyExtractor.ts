import { StoryDependency } from '../types/StoryDependency.js';
import { SymbolGraph } from '@codememory/symbol-graph';

export class DependencyExtractor {
  public extractDependencies(symbolId: string, graph?: SymbolGraph): StoryDependency[] {
    if (!graph) return [];

    const dependencies: StoryDependency[] = [];
    const outgoing = graph.getEdges(symbolId, undefined);

    for (const edge of outgoing) {
      const tgtNode = graph.getNode(edge.toId);
      if (tgtNode) {
        dependencies.push({
          targetId: tgtNode.id,
          targetName: tgtNode.name,
          relationship: (edge.type as any) ?? 'DEPENDS_ON',
          firstObservedAt: new Date().toISOString(),
          lastObservedAt: new Date().toISOString(),
          active: true,
          confidence: 0.95,
        });
      }
    }

    return dependencies;
  }
}
