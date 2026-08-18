import { Result, ok } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';
import { IEventBus } from '@codememory/event-bus';

export class PublishPipelineEventsStage implements PipelineStage {
  public readonly stageName = 'PublishPipelineEvents';

  constructor(private readonly eventBus?: IEventBus) {}

  public async execute(context: PipelineContext): Promise<Result<PipelineContext>> {
    if (this.eventBus) {
      await this.eventBus.publish({
        id: `pipe_${Date.now()}`,
        type: 'PIPELINE_COMPLETE',
        source: 'intelligence-pipeline',
        timestamp: new Date().toISOString(),
        correlationId: context.event?.timestamp || `corr_${Date.now()}`,
        payload: {
          filesProcessed: context.metrics.filesProcessed,
          nodesDiscovered: context.metrics.graphNodes,
          edgesDiscovered: context.metrics.graphEdges,
        },
        metadata: {
          totalDurationMs: context.metrics.totalDurationMs,
        },
      });
    }
    return ok(context);
  }
}
