import { Result, ok } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';
import { TreeSitterFactory } from '@codememory/tree-sitter-engine';

export class SelectParserStage implements PipelineStage {
  public readonly stageName = 'SelectParser';

  constructor(private readonly parserFactory: TreeSitterFactory) {}

  public async execute(context: PipelineContext): Promise<Result<PipelineContext>> {
    for (const change of context.changedFiles) {
      const ext = change.filePath.split('.').pop()?.toLowerCase();
      let lang = 'typescript';
      if (ext === 'js' || ext === 'jsx') lang = 'javascript';
      else if (ext === 'py') lang = 'python';
      else if (ext === 'rs') lang = 'rust';
      else if (ext === 'go') lang = 'go';

      const parserRes = await this.parserFactory.getParser(lang);
      if (parserRes.isSuccess) {
        context.selectedParsers.set(change.filePath, parserRes.value);
      } else {
        context.addWarning(`No parser found for file ${change.filePath} (${lang})`);
      }
    }
    return ok(context);
  }
}
