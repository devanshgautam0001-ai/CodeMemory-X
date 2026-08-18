import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('Secret Safety & Redaction Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('never exposes API keys or secrets in error messages', async () => {
    const sensitiveKey = 'sk-proj-99999999999999999999999999';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => `Invalid key provided: ${sensitiveKey}`,
    });

    const provider = new OpenAIProvider({ apiKey: sensitiveKey });
    const req: IAIRequest = { messages: [{ role: 'user', content: 'hi' }] };

    const res = await provider.generate(req);

    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      const errMsg = res.error.message;
      expect(errMsg).not.toContain(sensitiveKey);
      expect(errMsg).toContain('sk-***REDACTED***');
    }
  });
});
