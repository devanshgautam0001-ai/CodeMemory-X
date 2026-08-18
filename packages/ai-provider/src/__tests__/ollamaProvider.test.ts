import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('OllamaProvider Unit Tests (Local-First)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('works local-first without API key required', async () => {
    const mockResponse = {
      model: 'llama3.1',
      message: { role: 'assistant', content: 'Local llama response' },
      done: true,
      prompt_eval_count: 12,
      eval_count: 6,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const provider = new OllamaProvider({});
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Hello local model' }],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Local llama response');
      expect(res.value.usage?.totalTokens).toBe(18);
    }
  });

  it('handles connection error gracefully with PROVIDER_UNAVAILABLE when Ollama daemon is offline', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fetch failed ECONNREFUSED 127.0.0.1:11434'));

    const provider = new OllamaProvider({});
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Hello' }],
    };

    const res = await provider.generate(req);

    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      expect((res.error as any).code).toBe('NETWORK_ERROR');
    }
  });
});
