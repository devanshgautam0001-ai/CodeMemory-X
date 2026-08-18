import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('Claude Tool Calling Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('transforms Anthropic input_schema and parses tool_use response blocks', async () => {
    const mockResponse = {
      id: 'msg_tool_1',
      stop_reason: 'tool_use',
      content: [
        { type: 'text', text: 'Searching memory now...' },
        {
          type: 'tool_use',
          id: 'toolu_01X',
          name: 'find_symbol',
          input: { name: 'MemoryEngine' },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 25 },
    };

    let capturedBody: any;
    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return { ok: true, json: async () => mockResponse };
    });

    const provider = new ClaudeProvider({ apiKey: 'secret-key' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Locate MemoryEngine' }],
      tools: [{ name: 'find_symbol', description: 'Finds a symbol', parameters: { type: 'object' } }],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Searching memory now...');
      expect(res.value.toolCalls).toEqual([
        {
          id: 'toolu_01X',
          name: 'find_symbol',
          arguments: { name: 'MemoryEngine' },
        },
      ]);
    }

    expect(capturedBody.tools[0].input_schema).toBeDefined();
  });
});
