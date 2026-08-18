export interface ToolDefinition {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string | Record<string, unknown>;
  isError?: boolean;
}

export type ToolChoiceOption =
  | 'auto'
  | 'none'
  | 'required'
  | { type: 'function'; name: string };
