import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('ClaudeProvider Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('transforms system messages and parses Claude API response', async () => {
    const mockResponse = {
      id: 'msg_123',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'Claude response' }],
      model: 'claude-3-5-sonnet-20241022',
      stop_reason: 'end_turn',
      usage: { input_tokens: 20, output_tokens: 10 },
    };

    let capturedBody: any;
    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return { ok: true, json: async () => mockResponse };
    });

    const provider = new ClaudeProvider({ apiKey: 'anthropic-secret-key-999' });
    const req: IAIRequest = {
      messages: [
        { role: 'system', content: 'You are helpful.' },
        { role: 'user', content: 'Hello' },
      ],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Claude response');
      expect(res.value.usage?.totalTokens).toBe(30);
    }
    expect(capturedBody.system).toBe('You are helpful.');
    expect(capturedBody.messages).toHaveLength(1);
  });
});
