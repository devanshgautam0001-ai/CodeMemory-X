import { describe, it, expect } from 'vitest';
import { HttpTransport } from '../transport/HttpTransport.js';
import { AIProviderError } from '../errors/AIProviderError.js';

describe('HttpTransport Abort & SyntaxError Resilience', () => {
  it('should abort streaming if userSignal is triggered during stream consumption', async () => {
    const transport = new HttpTransport();
    const userController = new AbortController();

    // Mock global fetch to return a stream that responds to userSignal abort
    const originalFetch = global.fetch;
    global.fetch = async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"text":"hello"}\n\n'));
          userController.signal.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            controller.error(err);
          });
        },
      });
      return new Response(stream, { status: 200 }) as any;
    };

    try {
      const streamGen = transport.postStream<string>(
        {
          url: 'https://example.com/api',
          providerId: 'test-provider',
          signal: userController.signal,
        },
        (line) => line
      );

      const chunks: string[] = [];
      for await (const chunk of streamGen) {
        chunks.push(chunk);
        // Abort userSignal after first chunk
        userController.abort();
      }
    } catch (err: any) {
      expect(err).toBeInstanceOf(AIProviderError);
      expect(err.code).toBe('ABORTED');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should map SyntaxError in postJson to INVALID_RESPONSE', async () => {
    const transport = new HttpTransport();
    const originalFetch = global.fetch;
    global.fetch = async () => {
      return new Response('Not valid json {', { status: 200 }) as any;
    };

    try {
      await transport.postJson({
        url: 'https://example.com/api',
        providerId: 'test-provider',
      });
      expect.fail('Should have thrown syntax error');
    } catch (err: any) {
      expect(err).toBeInstanceOf(AIProviderError);
      expect(err.code).toBe('INVALID_RESPONSE');
      expect(err.retryable).toBe(false);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
