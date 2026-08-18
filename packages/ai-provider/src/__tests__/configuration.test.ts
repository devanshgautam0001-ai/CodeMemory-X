import { describe, it, expect } from 'vitest';
import { AIProviderFactory } from '../factory/AIProviderFactory.js';

describe('AIProvider Configuration & Runtime Switching', () => {
  it('should apply custom configuration parameters on provider instantiation', () => {
    const factory = new AIProviderFactory();
    const res = factory.getProvider('openai', {
      apiKey: 'sk-test-key-123',
      defaultModel: 'gpt-4o-mini',
    });

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect((res.value as any).config.apiKey).toBe('sk-test-key-123');
      expect((res.value as any).config.defaultModel).toBe('gpt-4o-mini');
    }
  });

  it('should return failure Result on missing apiKey for cloud provider', async () => {
    const factory = new AIProviderFactory();
    const providerRes = factory.getProvider('claude');
    expect(providerRes.isSuccess).toBe(true);

    if (providerRes.isSuccess) {
      const provider = providerRes.value;
      const genRes = await provider.generate({ messages: [{ role: 'user', content: 'Hello' }] });
      expect(genRes.isFailure).toBe(true);
      if (genRes.isFailure) {
        expect((genRes.error as any).code).toBe('CONFIGURATION_ERROR');
      }
    }
  });
});
