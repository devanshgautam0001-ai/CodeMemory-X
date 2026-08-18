import { describe, it, expect } from 'vitest';
import { AIProviderFactory } from '../factory/AIProviderFactory.js';

describe('AIProviderFactory Resolution', () => {
  it('should instantiate all 10 default provider adapters', () => {
    const factory = new AIProviderFactory();
    const providers = ['openai', 'claude', 'gemini', 'ollama', 'lmstudio', 'azure', 'openrouter', 'deepseek', 'groq', 'mistral'];

    for (const pId of providers) {
      const res = factory.getProvider(pId);
      expect(res.isSuccess).toBe(true);
      if (res.isSuccess) {
        expect(res.value.metadata.id).toBe(pId);
      }
    }
  });

  it('should return failure for unknown provider ID', () => {
    const factory = new AIProviderFactory();
    const res = factory.getProvider('unknown-llm');
    expect(res.isFailure).toBe(true);
  });
});
