import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('Ollama Tool Calling Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('parses tool calls from Ollama chat response when supported by model', async () => {
    const mockResponse = {
      model: 'llama3.1',
      message: {
        role: 'assistant',
        content: '',
        tool_calls: [
          {
            function: {
              name: 'query_memory',
              arguments: { filter: 'drift' },
            },
          },
        ],
      },
      done: true,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new OllamaProvider({});
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Query drift memory' }],
      tools: [{ name: 'query_memory', parameters: { type: 'object' } }],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.finishReason).toBe('tool_calls');
      expect(res.value.toolCalls?.[0].name).toBe('query_memory');
      expect(res.value.toolCalls?.[0].arguments).toEqual({ filter: 'drift' });
    }
  });
});
