import { ToolDefinition, ToolChoiceOption, ToolResult } from './ToolTypes.js';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface IAIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  jsonMode?: boolean;
  stopSequences?: string[];
  tools?: ToolDefinition[];
  toolChoice?: ToolChoiceOption;
  toolResults?: ToolResult[];
  signal?: AbortSignal;
}

export interface ToolCallDelta {
  id?: string;
  name?: string;
  argumentsDelta?: string;
  index?: number;
}

export interface StreamingChunk {
  contentDelta: string;
  toolCallDelta?: ToolCallDelta;
  finishReason?: string | null;
}
