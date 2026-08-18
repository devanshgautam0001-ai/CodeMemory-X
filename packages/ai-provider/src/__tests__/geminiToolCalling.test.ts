import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('Gemini Function Calling Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('transforms functionDeclarations and parses functionCall in parts', async () => {
    const mockResponse = {
      candidates: [
        {
          finishReason: 'STOP',
          content: {
            parts: [
              {
                functionCall: {
                  name: 'get_impact',
                  args: { symbol: 'EventStore' },
                },
              },
            ],
          },
        },
      ],
    };

    let capturedBody: any;
    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return { ok: true, json: async () => mockResponse };
    });

    const provider = new GeminiProvider({ apiKey: 'gemini-key' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'What is the impact of changing EventStore?' }],
      tools: [{ name: 'get_impact', parameters: { type: 'object' } }],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.finishReason).toBe('tool_calls');
      expect(res.value.toolCalls?.[0].name).toBe('get_impact');
      expect(res.value.toolCalls?.[0].arguments).toEqual({ symbol: 'EventStore' });
    }

    expect(capturedBody.tools[0].functionDeclarations[0].name).toBe('get_impact');
  });
});
