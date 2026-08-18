import { describe, it, expect } from 'vitest';
import { ProviderRegistry } from '../registry/ProviderRegistry.js';
import { OpenAIProvider, ClaudeProvider } from '../adapters/CloudAndLocalAdapters1.js';

describe('ProviderRegistry Provider Registration', () => {
  it('should register and retrieve providers by ID case-insensitively', () => {
    const registry = new ProviderRegistry();
    const openai = new OpenAIProvider();
    const claude = new ClaudeProvider();

    registry.register(openai);
    registry.register(claude);

    expect(registry.has('OpenAI')).toBe(true);
    expect(registry.get('openai')?.metadata.name).toBe('OpenAI Provider');

    expect(registry.has('CLAUDE')).toBe(true);
    expect(registry.get('claude')?.metadata.vendor).toBe('Anthropic');

    expect(registry.listProviders()).toHaveLength(2);
  });
});
