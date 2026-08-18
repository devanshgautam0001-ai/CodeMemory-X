import { Result } from '@codememory/shared';
import { PipelineContext } from '../context/PipelineContext.js';

export interface PipelineStage {
  readonly stageName: string;
  execute(context: PipelineContext): Promise<Result<PipelineContext>>;
}
