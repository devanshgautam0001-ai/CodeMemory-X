import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LMStudioProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('LMStudio Tool Calling Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('translates tools using OpenAI-compatible payload format for LM Studio', async () => {
    const mockResponse = {
      id: 'lm_tc_1',
      choices: [
        {
          finish_reason: 'tool_calls',
          message: {
            tool_calls: [
              {
                id: 'call_lm_1',
                type: 'function',
                function: {
                  name: 'local_tool',
                  arguments: '{"arg1":"val1"}',
                },
              },
            ],
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new LMStudioProvider({});
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Run local tool' }],
      tools: [{ name: 'local_tool', parameters: { type: 'object' } }],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.finishReason).toBe('tool_calls');
      expect(res.value.toolCalls?.[0].name).toBe('local_tool');
    }
  });
});
