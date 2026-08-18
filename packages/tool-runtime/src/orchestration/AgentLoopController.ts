import { ToolExecutionError } from '../types/ToolExecutionError.js';
import { ToolRuntimeConfig } from '../types/ToolRuntimeConfig.js';

export class AgentLoopController {
  private iterationCount = 0;
  private totalToolCalls = 0;
  private readonly startTime = Date.now();

  private readonly maxIterations: number;
  private readonly maxToolCalls: number;
  private readonly maxExecutionTimeMs: number;

  constructor(config?: ToolRuntimeConfig) {
    this.maxIterations = config?.maxIterations ?? 8;
    this.maxToolCalls = config?.maxToolCalls ?? 32;
    this.maxExecutionTimeMs = config?.maxExecutionTimeMs ?? 120000;
  }

  public incrementIteration(): void {
    this.iterationCount++;
    this.checkLimits();
  }

  public incrementToolCalls(count: number): void {
    this.totalToolCalls += count;
    this.checkLimits();
  }

  public checkLimits(): void {
    if (this.iterationCount > this.maxIterations) {
      throw new ToolExecutionError({
        code: 'ORCHESTRATION_LIMIT',
        message: `Agent loop exceeded maximum allowed iterations limit (${this.iterationCount} > ${this.maxIterations}). Orchestration stopped.`,
      });
    }

    if (this.totalToolCalls > this.maxToolCalls) {
      throw new ToolExecutionError({
        code: 'ORCHESTRATION_LIMIT',
        message: `Agent loop exceeded maximum total tool calls limit (${this.totalToolCalls} > ${this.maxToolCalls}). Orchestration stopped.`,
      });
    }

    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.maxExecutionTimeMs) {
      throw new ToolExecutionError({
        code: 'ORCHESTRATION_LIMIT',
        message: `Agent loop exceeded maximum total execution time limit (${elapsed}ms > ${this.maxExecutionTimeMs}ms). Orchestration stopped.`,
      });
    }
  }

  public getStats() {
    return {
      iterations: this.iterationCount,
      toolCalls: this.totalToolCalls,
      elapsedMs: Date.now() - this.startTime,
    };
  }
}
