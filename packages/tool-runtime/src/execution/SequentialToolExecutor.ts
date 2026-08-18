import { ToolCall, ToolResult } from '../types/ToolRuntimeTypes.js';
import { ToolExecutionContext } from '../types/ToolExecutionContext.js';
import { ToolExecutionResult } from '../types/ToolExecutionResult.js';
import { ToolExecutor } from './ToolExecutor.js';

export interface BatchExecutionResponse {
  executionResults: ToolExecutionResult[];
  toolResults: ToolResult[];
}

export class SequentialToolExecutor {
  constructor(private readonly executor: ToolExecutor) {}

  public async execute(
    toolCalls: ToolCall[],
    parentContext?: Partial<ToolExecutionContext>,
    continueOnError = true
  ): Promise<BatchExecutionResponse> {
    const executionResults: ToolExecutionResult[] = [];
    const toolResults: ToolResult[] = [];

    for (const call of toolCalls) {
      if (parentContext?.signal?.aborted) {
        break;
      }

      const { executionResult, normalizedResult } = await this.executor.executeCall(
        call,
        parentContext
      );

      executionResults.push(executionResult);
      toolResults.push(normalizedResult);

      if (!executionResult.success && !continueOnError) {
        break;
      }
    }

    return { executionResults, toolResults };
  }
}
