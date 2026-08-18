export type AssistantRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
