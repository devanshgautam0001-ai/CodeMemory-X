import { Result, ok, fail } from '@codememory/shared';
import { PipelineStage } from '../ports/PipelineStage.js';
import { PipelineContext } from '../context/PipelineContext.js';
import { IntelligenceResult } from '../types/PipelineResult.js';
import { ILogger } from '@codememory/logging';

export class PipelineExecutor {
  constructor(
    private readonly stages: PipelineStage[],
    private readonly logger?: ILogger
  ) {}

  public async run(initialContext: PipelineContext): Promise<Result<IntelligenceResult>> {
    const startTime = Date.now();
    let currentContext = initialContext;

    this.logger?.info(`[PipelineExecutor] Starting execution of ${this.stages.length} pipeline stages`);

    for (const stage of this.stages) {
      const stageStart = Date.now();
      try {
        this.logger?.info(`[PipelineExecutor] Executing stage: ${stage.stageName}`);
        const stageRes = await stage.execute(currentContext);
        const stageDuration = Date.now() - stageStart;

        if (stageRes.isFailure) {
          currentContext.addError(`Stage [${stage.stageName}] failed: ${stageRes.error.message}`);
          currentContext.metrics.stageDurations.push({
            stageName: stage.stageName,
            durationMs: stageDuration,
            success: false,
          });
          return fail(stageRes.error);
        }

        currentContext = stageRes.value;
        currentContext.metrics.stageDurations.push({
          stageName: stage.stageName,
          durationMs: stageDuration,
          success: true,
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        currentContext.addError(`Unhandled exception in stage [${stage.stageName}]: ${err.message}`);
        currentContext.metrics.stageDurations.push({
          stageName: stage.stageName,
          durationMs: Date.now() - stageStart,
          success: false,
        });
        return fail(err);
      }
    }

    currentContext.metrics.totalDurationMs = Date.now() - startTime;
    this.logger?.info(`[PipelineExecutor] Completed pipeline in ${currentContext.metrics.totalDurationMs}ms`);

    const result: IntelligenceResult = {
      symbolGraph: currentContext.symbolGraph,
      parseResults: currentContext.parseResults,
      metrics: currentContext.metrics,
      errors: currentContext.errors,
      warnings: currentContext.warnings,
    };

    return ok(result);
  }
}
