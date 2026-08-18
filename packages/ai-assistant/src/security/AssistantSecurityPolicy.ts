import { AIProviderError } from '@codememory/ai-provider';

export class AssistantSecurityPolicy {
  public static sanitize(text: string): string {
    if (!text) return '';
    return AIProviderError.sanitizeText(text);
  }

  public static validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Assistant prompt cannot be empty.');
    }
  }
}
