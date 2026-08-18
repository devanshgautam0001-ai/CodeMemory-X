import { ToolDefinition, ToolCall, ToolResult, ToolChoiceOption } from '@codememory/ai-provider';
import { ToolExecutionContext } from './ToolExecutionContext.js';
import { ToolExecutionResult } from './ToolExecutionResult.js';

export { ToolDefinition, ToolCall, ToolResult, ToolChoiceOption };

export interface ToolHandler {
  (
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult>;
}

export interface RegisteredTool {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
  execute: ToolHandler;
}
