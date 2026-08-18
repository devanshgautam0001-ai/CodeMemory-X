import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('OpenAIProvider Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('constructs OpenAI POST request and parses normalized response', async () => {
    const mockResponse = {
      id: 'chatcmpl-123',
      model: 'gpt-4o',
      choices: [
        {
          message: { role: 'assistant', content: 'Hello developer!' },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new OpenAIProvider({ apiKey: 'sk-test-key-12345' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Hi' }],
      model: 'gpt-4o',
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Hello developer!');
      expect(res.value.model).toBe('gpt-4o');
      expect(res.value.usage?.totalTokens).toBe(15);
    }
  });

  it('parses OpenAI SSE streaming chunks correctly', async () => {
    const streamData = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(streamData));
        controller.close();
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });

    const provider = new OpenAIProvider({ apiKey: 'sk-test-key-12345' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Hi' }],
    };

    const chunks: string[] = [];
    for await (const chunk of provider.generateStream(req)) {
      chunks.push(chunk.contentDelta);
    }

    expect(chunks.join('')).toBe('Hello World');
  });

  it('fails with CONFIGURATION_ERROR if apiKey is missing', async () => {
    const provider = new OpenAIProvider({});
    const req: IAIRequest = { messages: [{ role: 'user', content: 'Hi' }] };

    const res = await provider.generate(req);

    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      expect((res.error as any).code).toBe('CONFIGURATION_ERROR');
    }
  });
});
