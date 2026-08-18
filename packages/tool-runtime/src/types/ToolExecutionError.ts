import { AIProviderError } from '@codememory/ai-provider';

export type ToolErrorCode =
  | 'TOOL_NOT_FOUND'
  | 'INVALID_ARGUMENTS'
  | 'PERMISSION_DENIED'
  | 'CONFIRMATION_REQUIRED'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'EXECUTION_FAILED'
  | 'INVALID_RESULT'
  | 'TOOL_LIMIT_EXCEEDED'
  | 'CONCURRENCY_LIMIT'
  | 'ORCHESTRATION_LIMIT'
  | 'UNKNOWN';

export interface ToolExecutionErrorParams {
  toolName?: string;
  code: ToolErrorCode;
  message: string;
  cause?: unknown;
}

export class ToolExecutionError extends Error {
  public readonly toolName?: string;
  public readonly code: ToolErrorCode;

  constructor(params: ToolExecutionErrorParams) {
    const sanitizedMessage = AIProviderError.sanitizeText(params.message);
    const prefix = params.toolName ? `[${params.toolName}] ` : '';
    super(`${prefix}${params.code}: ${sanitizedMessage}`);

    this.name = 'ToolExecutionError';
    this.toolName = params.toolName;
    this.code = params.code;

    if (params.cause) {
      this.cause = params.cause;
    }
  }
}
