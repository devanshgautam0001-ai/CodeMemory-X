import { describe, it, expect, vi } from 'vitest';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';
import { IAIProvider, StreamingChunk } from '@codememory/ai-provider';
import { ok, fail } from '@codememory/shared';

describe('AIAssistantEngine Public API Verification Unit Tests', () => {
  it('verifies ask, getContext, getConversation, and clearConversation APIs', async () => {
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: false, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: false, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn().mockResolvedValue(ok({ id: 'r1', model: 'm', content: 'Answer', finishReason: 'stop' })),
      generateStream: vi.fn() as any,
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });

    const context = await engine.getContext({ requestId: 'r1', prompt: 'hi' });
    expect(context).toBeDefined();

    const askRes = await engine.ask({ requestId: 'r1', prompt: 'hi', conversationId: 'c1' });
    expect(askRes.isSuccess).toBe(true);

    const history = engine.getConversation('c1');
    expect(history).toHaveLength(2);

    engine.clearConversation('c1');
    expect(engine.getConversation('c1')).toHaveLength(0);
  });

  it('verifies stream() API yields chunks incrementally and records conversation history', async () => {
    async function* mockStream(): AsyncGenerator<StreamingChunk> {
      yield { index: 0, contentDelta: 'Hello ' };
      yield { index: 1, contentDelta: 'world!' };
    }

    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: true, toolCalling: false, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: false, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn(),
      generateStream: vi.fn().mockReturnValue(mockStream()),
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    const chunks: StreamingChunk[] = [];
    for await (const chunk of engine.stream({ requestId: 'req_s1', prompt: 'Stream test', conversationId: 'conv_stream' })) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(2);
    expect(chunks[0].contentDelta).toBe('Hello ');
    expect(chunks[1].contentDelta).toBe('world!');

    const history = engine.getConversation('conv_stream');
    expect(history).toHaveLength(2);
    expect(history[1].content).toBe('Hello world!');
  });

  it('returns failure Result when provider generate returns error', async () => {
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: false, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: false, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn().mockResolvedValue(fail(new Error('Provider failed'))),
      generateStream: vi.fn() as any,
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    const res = await engine.ask({ requestId: 'r_fail', prompt: 'fail query' });
    expect(res.isFailure).toBe(true);
  });

  it('handles provider exceptions inside ask cleanly', async () => {
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: false, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: false, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn().mockRejectedValue(new Error('Fatal error')),
      generateStream: vi.fn() as any,
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    const res = await engine.ask({ requestId: 'r_err', prompt: 'error query' });
    expect(res.isFailure).toBe(true);
  });
});
