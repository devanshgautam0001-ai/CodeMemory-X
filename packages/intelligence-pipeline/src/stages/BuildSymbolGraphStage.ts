import { Result, ok } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';
import { SymbolGraphBuilder, SymbolGraph } from '@codememory/symbol-graph';

export class BuildSymbolGraphStage implements PipelineStage {
  public readonly stageName = 'BuildSymbolGraph';

  constructor(private readonly graphBuilder: SymbolGraphBuilder) {}

  public async execute(context: PipelineContext): Promise<Result<PipelineContext>> {
    let compositeGraph = new SymbolGraph();

    for (const pr of context.parseResults) {
      const graphRes = this.graphBuilder.buildFromParseResult(pr);
      if (graphRes.isSuccess) {
        compositeGraph = compositeGraph.merge(graphRes.value);
      } else {
        context.addError(`Failed to build graph for ${pr.sourcePath}: ${graphRes.error.message}`);
      }
    }

    context.symbolGraph = compositeGraph;
    context.metrics.graphNodes = compositeGraph.getAllNodes().length;
    context.metrics.graphEdges = compositeGraph.getAllEdges().length;

    return ok(context);
  }
}
