import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('SecurityToolArguments Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('safely handles malformed tool input and redacts API keys in errors', async () => {
    const sensitiveKey = 'sk-proj-secret1234567890abcdefghijklm';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => `Error with key ${sensitiveKey}`,
    });

    const provider = new OpenAIProvider({ apiKey: sensitiveKey });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'test' }],
      tools: [{ name: 'test_tool', parameters: {} }],
    };

    const res = await provider.generate(req);

    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      expect(res.error.message).not.toContain(sensitiveKey);
      expect(res.error.message).toContain('sk-***REDACTED***');
    }
  });
});
