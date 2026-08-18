import { ToolCall } from './ToolTypes.js';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface IAIResponse {
  id: string;
  model: string;
  content: string;
  toolCalls?: ToolCall[];
  finishReason: string;
  usage?: TokenUsage;
  rawResponse?: unknown;
}
