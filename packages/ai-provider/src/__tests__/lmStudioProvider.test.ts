import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LMStudioProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('LMStudioProvider Unit Tests (Local-First)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('connects to local LM Studio OpenAI-compatible endpoint without requiring API key', async () => {
    const mockResponse = {
      id: 'lm-1',
      model: 'qwen2.5-7b',
      choices: [{ message: { role: 'assistant', content: 'LM Studio response' }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 8, completion_tokens: 4, total_tokens: 12 },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new LMStudioProvider({});
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Test LM Studio' }],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('LM Studio response');
      expect(res.value.usage?.totalTokens).toBe(12);
    }
  });
});
