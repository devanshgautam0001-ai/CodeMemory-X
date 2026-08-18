import { describe, it, expect } from 'vitest';
import { CapabilityResolver } from '../resolver/CapabilityResolver.js';
import { OpenAIProvider, ClaudeProvider, GeminiProvider, OllamaProvider, LMStudioProvider } from '../adapters/CloudAndLocalAdapters1.js';

describe('CapabilityToolCalling Unit Tests', () => {
  it('reflects accurate tool calling capability across all production adapters', () => {
    const resolver = new CapabilityResolver();
    const providers = [
      new OpenAIProvider({ apiKey: 'key' }),
      new ClaudeProvider({ apiKey: 'key' }),
      new GeminiProvider({ apiKey: 'key' }),
      new OllamaProvider({}),
      new LMStudioProvider({}),
    ];

    const toolCapableProviders = resolver.filterByCapability(providers, { toolCalling: true });

    expect(toolCapableProviders).toHaveLength(5);
  });
});
