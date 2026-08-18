import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpTransport } from '../transport/HttpTransport.js';

describe('HttpTransport Streaming Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('parses SSE lines incrementally and handles [DONE] line cleanly', async () => {
    const ssePayload = [
      'data: {"text": "Hello"}\n\n',
      'data: {"text": " World"}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(ssePayload));
        controller.close();
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    });

    const transport = new HttpTransport();
    const chunks: string[] = [];

    const streamGen = transport.postStream(
      { url: 'http://test', providerId: 'test' },
      (line) => {
        if (line.startsWith('data: ')) {
          const body = line.slice(6).trim();
          if (body === '[DONE]') return null;
          return JSON.parse(body).text;
        }
        return null;
      }
    );

    for await (const chunk of streamGen) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('Hello World');
  });
});
