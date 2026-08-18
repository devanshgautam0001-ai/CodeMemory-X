import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('ToolStreaming Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('emits incremental toolCallDelta streaming chunks for OpenAI', async () => {
    const sseData = [
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_s1","function":{"name":"search"}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"q\\":\\"test\\""}}]}}]}\n\n',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"}"}}]}}]}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseData));
        controller.close();
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Stream tool' }],
      tools: [{ name: 'search', parameters: {} }],
    };

    const deltas: any[] = [];
    for await (const chunk of provider.generateStream(req)) {
      if (chunk.toolCallDelta) {
        deltas.push(chunk.toolCallDelta);
      }
    }

    expect(deltas).toHaveLength(3);
    expect(deltas[0].name).toBe('search');
    expect(deltas[1].argumentsDelta).toBe('{"q":"test"');
  });
});
