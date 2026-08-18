import { AssistantContext } from './AssistantContext.js';

export interface AssistantResponse {
  requestId: string;
  conversationId: string;
  content: string;
  contextUsed: AssistantContext;
  toolCallsExecuted?: any[];
  durationMs: number;
  finishReason?: string;
}
