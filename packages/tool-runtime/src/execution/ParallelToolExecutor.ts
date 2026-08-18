import { ToolCall, ToolResult } from '../types/ToolRuntimeTypes.js';
import { ToolExecutionContext } from '../types/ToolExecutionContext.js';
import { ToolExecutionResult } from '../types/ToolExecutionResult.js';
import { ToolExecutor } from './ToolExecutor.js';
import { BatchExecutionResponse } from './SequentialToolExecutor.js';

export class ParallelToolExecutor {
  constructor(
    private readonly executor: ToolExecutor,
    private readonly maxConcurrency = 4
  ) {}

  public async execute(
    toolCalls: ToolCall[],
    parentContext?: Partial<ToolExecutionContext>
  ): Promise<BatchExecutionResponse> {
    if (!toolCalls || toolCalls.length === 0) {
      return { executionResults: [], toolResults: [] };
    }

    const resultsMap = new Map<number, { executionResult: ToolExecutionResult; normalizedResult: ToolResult }>();
    let nextIndex = 0;
    const limit = Math.max(1, this.maxConcurrency);

    const worker = async () => {
      while (nextIndex < toolCalls.length) {
        if (parentContext?.signal?.aborted) {
          break;
        }

        const currentIndex = nextIndex++;
        const call = toolCalls[currentIndex];

        try {
          const res = await this.executor.executeCall(call, parentContext);
          resultsMap.set(currentIndex, res);
        } catch (err: any) {
          const errMsg = err?.message ?? 'Parallel tool execution failed';
          resultsMap.set(currentIndex, {
            executionResult: {
              success: false,
              content: { error: errMsg },
              error: { code: 'EXECUTION_FAILED', message: errMsg },
            },
            normalizedResult: {
              toolCallId: call.id,
              content: JSON.stringify({ error: errMsg, code: 'EXECUTION_FAILED' }),
              isError: true,
            },
          });
        }
      }
    };

    const workers = Array.from({ length: Math.min(limit, toolCalls.length) }, () => worker());
    await Promise.all(workers);

    const executionResults: ToolExecutionResult[] = [];
    const toolResults: ToolResult[] = [];

    for (let i = 0; i < toolCalls.length; i++) {
      const res = resultsMap.get(i);
      if (res) {
        executionResults.push(res.executionResult);
        toolResults.push(res.normalizedResult);
      } else {
        const cancelledResult: ToolExecutionResult = {
          success: false,
          content: { error: 'Execution cancelled before start' },
          error: { code: 'ABORTED', message: 'Execution cancelled before start' },
        };
        executionResults.push(cancelledResult);
        toolResults.push({
          toolCallId: toolCalls[i].id,
          content: JSON.stringify({ error: 'Execution cancelled before start', code: 'ABORTED' }),
          isError: true,
        });
      }
    }

    return { executionResults, toolResults };
  }
}
