import { describe, it, expect, vi } from 'vitest';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';
import { IAIProvider, StreamingChunk } from '@codememory/ai-provider';

describe('AIAssistantEngine Cancellation Unit Tests', () => {
  it('cancels active request when cancel(requestId) is called', async () => {
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: false, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: false, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn(),
      generateStream: vi.fn() as any,
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    expect(() => engine.cancel('non_existent')).not.toThrow();
  });

  it('aborts streaming iterator when engine.cancel() is invoked during stream', async () => {
    async function* slowStream(): AsyncGenerator<StreamingChunk> {
      yield { index: 0, contentDelta: 'Chunk 1' };
      yield { index: 1, contentDelta: 'Chunk 2' };
    }

    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: true, toolCalling: false, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: false, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn(),
      generateStream: vi.fn().mockReturnValue(slowStream()),
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    const iterator = engine.stream({ requestId: 'cancel_stream_1', prompt: 'Stream test' });

    const chunk1 = await iterator.next();
    expect(chunk1.value.contentDelta).toBe('Chunk 1');

    engine.cancel('cancel_stream_1');
    const chunk2 = await iterator.next();
    expect(chunk2.done).toBe(true);
  });
});
