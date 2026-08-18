import { IAIProvider, IAIRequest, IAIResponse } from '@codememory/ai-provider';
import { Result, ok, fail } from '@codememory/shared';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { SequentialToolExecutor } from '../execution/SequentialToolExecutor.js';
import { ParallelToolExecutor } from '../execution/ParallelToolExecutor.js';
import { AgentLoopController } from './AgentLoopController.js';
import { ToolExecutionContext } from '../types/ToolExecutionContext.js';
import { ToolRuntimeConfig } from '../types/ToolRuntimeConfig.js';
import { ToolExecutionError } from '../types/ToolExecutionError.js';
import { ILogger } from '@codememory/logging';

import { ToolCallStateMachine } from './ToolCallStateMachine.js';

export class ToolCallOrchestrator {
  private sequentialExecutor: SequentialToolExecutor;
  private parallelExecutor: ParallelToolExecutor;

  constructor(
    private readonly provider: IAIProvider,
    private readonly executor: ToolExecutor,
    private readonly config: ToolRuntimeConfig = {},
    private readonly logger?: ILogger
  ) {
    this.sequentialExecutor = new SequentialToolExecutor(this.executor);
    this.parallelExecutor = new ParallelToolExecutor(
      this.executor,
      config.maxConcurrency ?? 4
    );
  }

  public async orchestrate(
    request: IAIRequest,
    parentContext?: Partial<ToolExecutionContext>,
    useParallel = false
  ): Promise<Result<IAIResponse>> {
    const stateMachine = new ToolCallStateMachine(parentContext?.requestId ?? `req_${Date.now()}`);
    const loopController = new AgentLoopController(this.config);
    const reqCopy: IAIRequest = {
      ...request,
      messages: [...request.messages],
      signal: request.signal ?? parentContext?.signal,
    };

    while (true) {
      if (parentContext?.signal?.aborted) {
        stateMachine.transitionTo('FAILED', 'Aborted by signal');
        return fail(
          new ToolExecutionError({
            code: 'ABORTED',
            message: 'Orchestration cancelled by caller signal.',
          })
        );
      }

      stateMachine.transitionTo('REQUESTING');
      const responseResult = await this.provider.generate(reqCopy);
      if (responseResult.isFailure) {
        stateMachine.transitionTo('FAILED', responseResult.error.message);
        return responseResult;
      }

      const response = responseResult.value;
      const toolCalls = response.toolCalls;

      if (!toolCalls || toolCalls.length === 0) {
        stateMachine.transitionTo('COMPLETED');
        this.logger?.info('[ToolCallOrchestrator] Final AI response received without tool calls.');
        return ok(response);
      }

      stateMachine.transitionTo('TOOL_CALL_RECEIVED', `Received ${toolCalls.length} tool calls`);

      try {
        loopController.incrementIteration();
        loopController.incrementToolCalls(toolCalls.length);
      } catch (err: any) {
        stateMachine.transitionTo('FAILED', err.message);
        return fail(err);
      }

      this.logger?.info(
        `[ToolCallOrchestrator] Orchestrating ${toolCalls.length} tool call(s) (iteration ${loopController.getStats().iterations})`
      );

      stateMachine.transitionTo('PERMISSION_CHECK');
      stateMachine.transitionTo('EXECUTING');

      const batchResult = useParallel
        ? await this.parallelExecutor.execute(toolCalls, parentContext)
        : await this.sequentialExecutor.execute(
            toolCalls,
            parentContext,
            this.config.continueOnError ?? true
          );

      stateMachine.transitionTo('TOOL_RESULT', `Executed ${batchResult.toolResults.length} tool results`);

      reqCopy.messages.push({
        role: 'assistant',
        content: response.content || '',
      });

      reqCopy.toolResults = batchResult.toolResults;
      stateMachine.transitionTo('FOLLOWUP_REQUEST');
    }
  }
}
