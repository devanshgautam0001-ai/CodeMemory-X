export interface AIProviderCapabilities {
  streaming: boolean;
  toolCalling: boolean;
  jsonMode: boolean;
  vision: boolean;
  reasoning: boolean;
  embeddings: boolean;
  functionCalling: boolean;
  contextLength: number;
  supportsTemperature: boolean;
  maxTokens: number;
}
