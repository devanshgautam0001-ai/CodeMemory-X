import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpTransport } from '../transport/HttpTransport.js';

describe('HttpTransport Timeout Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('aborts request and throws TIMEOUT error when request exceeds timeoutMs', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url, options) => {
      return new Promise((_, reject) => {
        const signal = options.signal as AbortSignal;
        signal.addEventListener('abort', () => {
          const err = new Error('The operation was aborted');
          err.name = 'AbortError';
          reject(err);
        });
      });
    });

    const transport = new HttpTransport();

    await expect(
      transport.postJson({
        url: 'https://api.openai.com/v1/chat/completions',
        providerId: 'openai',
        timeoutMs: 50,
      })
    ).rejects.toThrow('TIMEOUT');
  });
});
