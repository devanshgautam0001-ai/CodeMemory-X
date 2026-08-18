import { describe, it, expect } from 'vitest';
import { CapabilityResolver } from '../resolver/CapabilityResolver.js';
import { OpenAIProvider, OllamaProvider } from '../adapters/CloudAndLocalAdapters1.js';

describe('CapabilityResolver Unit Tests', () => {
  it('filters registered providers based on required capabilities', () => {
    const resolver = new CapabilityResolver();
    const openai = new OpenAIProvider({ apiKey: 'key' });
    const ollama = new OllamaProvider({});

    const filtered = resolver.filterByCapability([openai, ollama], {
      streaming: true,
      contextLength: 100000,
    });

    expect(filtered).toHaveLength(2);
  });
});
