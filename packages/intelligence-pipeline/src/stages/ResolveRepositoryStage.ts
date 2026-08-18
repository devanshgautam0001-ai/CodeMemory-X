import { Result, ok } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';
import { GitService } from '@codememory/git-engine';

export class ResolveRepositoryStage implements PipelineStage {
  public readonly stageName = 'ResolveRepository';

  constructor(private readonly gitService?: GitService) {}

  public async execute(context: PipelineContext): Promise<Result<PipelineContext>> {
    if (this.gitService && context.workspacePath) {
      const repoRes = await this.gitService.getRepositoryInfo(context.workspacePath);
      if (repoRes.isSuccess) {
        context.repository = repoRes.value;
      } else {
        context.addWarning(`Could not resolve Git repository: ${repoRes.error.message}`);
      }
    }
    return ok(context);
  }
}
