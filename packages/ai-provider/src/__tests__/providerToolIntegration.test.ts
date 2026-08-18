import { describe, it, expect } from 'vitest';
import { AIProviderFactory } from '../factory/AIProviderFactory.js';

describe('ProviderToolIntegration Unit Tests', () => {
  it('instantiates all production adapters via factory and verifies tool calling capability', () => {
    const factory = new AIProviderFactory();

    const providerIds = ['openai', 'claude', 'gemini', 'ollama', 'lmstudio', 'azure', 'openrouter', 'deepseek', 'groq', 'mistral'];

    for (const pId of providerIds) {
      const res = factory.getProvider(pId, { apiKey: 'test-key' });
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.capabilities.toolCalling).toBe(true);
      }
    }
  });
});
