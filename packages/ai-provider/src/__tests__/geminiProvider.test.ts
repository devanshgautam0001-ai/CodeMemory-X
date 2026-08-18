import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('GeminiProvider Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('converts messages to Gemini contents format and parses response', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Gemini output' }],
            role: 'model',
          },
          finishReason: 'STOP',
        },
      ],
      usageMetadata: {
        promptTokenCount: 15,
        candidatesTokenCount: 8,
        totalTokenCount: 23,
      },
    };

    let capturedUrl = '';
    globalThis.fetch = vi.fn().mockImplementation(async (url) => {
      capturedUrl = String(url);
      return { ok: true, json: async () => mockResponse };
    });

    const provider = new GeminiProvider({ apiKey: 'gemini-key-123' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Explain physics' }],
    };

    const res = await provider.generate(req);

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Gemini output');
      expect(res.value.usage?.totalTokens).toBe(23);
    }
    expect(capturedUrl).toContain('key=gemini-key-123');
  });
});
