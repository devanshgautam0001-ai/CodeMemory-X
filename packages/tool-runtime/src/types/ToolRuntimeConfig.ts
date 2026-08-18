export interface ToolRuntimeConfig {
  defaultTimeoutMs?: number;
  maxTimeoutMs?: number;
  maxConcurrency?: number;
  maxIterations?: number;
  maxToolCalls?: number;
  maxExecutionTimeMs?: number;
  continueOnError?: boolean;
}
