import { Result, ok } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';
import { GitService, GitFileChange } from '@codememory/git-engine';

export class DetermineChangedFilesStage implements PipelineStage {
  public readonly stageName = 'DetermineChangedFiles';

  constructor(private readonly gitService?: GitService) {}

  public async execute(context: PipelineContext): Promise<Result<PipelineContext>> {
    if (context.event?.file) {
      context.changedFiles = [
        new GitFileChange({
          filePath: context.event.file,
          changeType: 'MODIFIED',
        }),
      ];
    } else if (this.gitService && context.workspacePath) {
      const changesRes = await this.gitService.getChangedFiles(context.workspacePath);
      if (changesRes.isSuccess) {
        context.changedFiles = changesRes.value;
      }
    }
    return ok(context);
  }
}
