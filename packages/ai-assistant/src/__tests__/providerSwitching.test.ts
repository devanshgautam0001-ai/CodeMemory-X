import { describe, it, expect, vi } from 'vitest';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';
import { IAIProvider } from '@codememory/ai-provider';

describe('AIAssistantEngine Dynamic Provider Switching Unit Tests', () => {
  it('switches AI Provider dynamically based on request.options.provider', async () => {
    const mockProvider: IAIProvider = {
      metadata: { id: 'default', name: 'Default', vendor: 'Default', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: false, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: false, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn(),
      generateStream: vi.fn() as any,
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });

    const providersToTest = ['ollama', 'openai', 'claude', 'gemini', 'lmstudio'];
    for (const prov of providersToTest) {
      const resolved = (engine as any).resolveProvider({ provider: prov, model: `${prov}-model` });
      expect(resolved).toBeDefined();
      expect(resolved.metadata.id).toBe(prov);
    }
  });
});
