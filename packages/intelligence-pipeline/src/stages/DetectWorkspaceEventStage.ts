import { Result, ok } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';

export class DetectWorkspaceEventStage implements PipelineStage {
  public readonly stageName = 'DetectWorkspaceEvent';

  public async execute(context: PipelineContext): Promise<Result<PipelineContext>> {
    if (!context.event) {
      context.addWarning('No workspace event attached to context.');
    }
    return ok(context);
  }
}
