import { describe, it, expect } from 'vitest';
import { AIProviderFactory } from '../factory/AIProviderFactory.js';

describe('AIProviderFactory Integration Unit Tests', () => {
  it('resolves all 5 production adapters (OpenAI, Claude, Gemini, Ollama, LM Studio)', () => {
    const factory = new AIProviderFactory();

    const openaiRes = factory.getProvider('openai', { apiKey: 'test' });
    const claudeRes = factory.getProvider('claude', { apiKey: 'test' });
    const geminiRes = factory.getProvider('gemini', { apiKey: 'test' });
    const ollamaRes = factory.getProvider('ollama');
    const lmstudioRes = factory.getProvider('lmstudio');

    expect(openaiRes.isSuccess).toBe(true);
    expect(claudeRes.isSuccess).toBe(true);
    expect(geminiRes.isSuccess).toBe(true);
    expect(ollamaRes.isSuccess).toBe(true);
    expect(lmstudioRes.isSuccess).toBe(true);

    if (openaiRes.isSuccess) expect(openaiRes.value.metadata.id).toBe('openai');
    if (claudeRes.isSuccess) expect(claudeRes.value.metadata.id).toBe('claude');
    if (geminiRes.isSuccess) expect(geminiRes.value.metadata.id).toBe('gemini');
    if (ollamaRes.isSuccess) expect(ollamaRes.value.metadata.id).toBe('ollama');
    if (lmstudioRes.isSuccess) expect(lmstudioRes.value.metadata.id).toBe('lmstudio');
  });

  it('supports case-insensitive provider lookup', () => {
    const factory = new AIProviderFactory();
    const res = factory.getProvider('OPENAI', { apiKey: 'test' });

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) expect(res.value.metadata.id).toBe('openai');
  });
});
