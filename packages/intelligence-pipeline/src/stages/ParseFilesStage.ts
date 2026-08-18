import { Result, ok } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';

export class ParseFilesStage implements PipelineStage {
  public readonly stageName = 'ParseFiles';

  public async execute(context: PipelineContext): Promise<Result<PipelineContext>> {
    for (const [filePath, parser] of context.selectedParsers.entries()) {
      // Execute parser with source code string or mock buffer
      const parseRes = await parser.parse('// source code placeholder', filePath);
      if (parseRes.isSuccess) {
        context.parseResults.push(parseRes.value);
        context.metrics.filesProcessed++;
        context.metrics.symbolsDiscovered += parseRes.value.symbols.length;
      } else {
        context.addError(`Failed to parse ${filePath}: ${parseRes.error.message}`);
      }
    }
    return ok(context);
  }
}
