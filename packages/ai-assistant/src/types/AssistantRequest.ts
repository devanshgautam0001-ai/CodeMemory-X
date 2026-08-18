export interface AssistantRequestOptions {
  provider?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enableTools?: boolean;
  maxContextTokens?: number;
}

export interface AssistantRequest {
  requestId: string;
  conversationId?: string;
  prompt: string;
  activeFilePath?: string;
  activeSymbolName?: string;
  workspacePath?: string;
  options?: AssistantRequestOptions;
}
