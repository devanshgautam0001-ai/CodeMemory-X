import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('OpenAI Tool Calling Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('transforms tools request and parses single and multiple tool calls in response', async () => {
    const mockResponse = {
      id: 'chatcmpl-tool-1',
      model: 'gpt-4o',
      choices: [
        {
          finish_reason: 'tool_calls',
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_abc1',
                type: 'function',
                function: {
                  name: 'search_memory',
                  arguments: '{"query":"VSCodeWorkspaceWatcher"}',
                },
              },
              {
                id: 'call_abc2',
                type: 'function',
                function: {
                  name: 'get_story',
                  arguments: '{"symbol":"VSCodeWorkspaceWatcher"}',
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

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Find VSCodeWorkspaceWatcher history' }],
      tools: [
        { name: 'search_memory', parameters: { type: 'object' } },
        { name: 'get_story', parameters: { type: 'object' } },
      ],
      toolChoice: 'auto',
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.finishReason).toBe('tool_calls');
      expect(res.value.toolCalls).toHaveLength(2);
      expect(res.value.toolCalls?.[0]).toEqual({
        id: 'call_abc1',
        name: 'search_memory',
        arguments: { query: 'VSCodeWorkspaceWatcher' },
      });
      expect(res.value.toolCalls?.[1]).toEqual({
        id: 'call_abc2',
        name: 'get_story',
        arguments: { symbol: 'VSCodeWorkspaceWatcher' },
      });
    }

    expect(capturedBody.tools).toHaveLength(2);
    expect(capturedBody.tool_choice).toBe('auto');
  });

  it('throws INVALID_RESPONSE on malformed JSON tool arguments', async () => {
    const mockMalformedResponse = {
      id: 'chatcmpl-bad',
      choices: [
        {
          message: {
            tool_calls: [
              {
                id: 'call_bad',
                type: 'function',
                function: { name: 'search', arguments: '{bad_json:}' },
              },
            ],
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMalformedResponse,
    });

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'test' }],
      tools: [{ name: 'search', parameters: {} }],
    };

    const res = await provider.generate(req);

    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      expect((res.error as any).code).toBe('INVALID_RESPONSE');
    }
  });
});
