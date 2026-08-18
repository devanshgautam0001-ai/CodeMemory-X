import { describe, it, expect, vi } from 'vitest';
import {
  AIProviderFactory,
  ClaudeProvider,
  OllamaProvider,
  GeminiProvider,
  LMStudioProvider,
  AIProviderError,
} from '../index.js';

describe('TASK-059 AI Provider Resilience, Secret Redaction & Parsing Hardening Suite', () => {
  it('1. AIProviderFactory registers and instantiates all 10 supported providers', () => {
    const factory = new AIProviderFactory();
    const providers = ['openai', 'claude', 'gemini', 'ollama', 'lmstudio', 'azure', 'openrouter', 'deepseek', 'groq', 'mistral'];

    for (const p of providers) {
      const res = factory.getProvider(p);
      expect(res.isSuccess).toBe(true);
      expect(res.value).toBeDefined();
    }
  });

  it('2. AIProviderError.sanitizeText redacts bearer tokens and sk- keys', () => {
    const secretKey = 'sk-secret-test-key-1234567890';
    const rawMsg = `Bearer ${secretKey} invalid credential with x-api-key:secret-key-1234567890`;
    const sanitized = AIProviderError.sanitizeText(rawMsg);

    expect(sanitized).not.toContain(secretKey);
    expect(sanitized).toContain('***REDACTED***');
  });

  it('3. ClaudeProvider handles empty SSE stream cleanly without throwing unhandled rejection', async () => {
    const provider = new ClaudeProvider({ apiKey: 'sk-ant-api-key-999' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => ({ done: true, value: undefined }),
        }),
      },
    });

    const chunks = [];
    for await (const chunk of provider.generateStream({ messages: [{ role: 'user', content: 'test' }] })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([]);
  });

  it('4. OllamaProvider handles NDJSON stream termination gracefully', async () => {
    const provider = new OllamaProvider({ baseUrl: 'http://localhost:11434' });

    const streamData = [
      JSON.stringify({ message: { content: 'hello ' }, done: false }) + '\n',
      JSON.stringify({ message: { content: 'world' }, done: true }) + '\n',
    ];

    let index = 0;
    const encoder = new TextEncoder();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (index < streamData.length) {
              const val = encoder.encode(streamData[index++]);
              return { done: false, value: val };
            }
            return { done: true, value: undefined };
          },
        }),
      },
    });

    let full = '';
    for await (const chunk of provider.generateStream({ messages: [{ role: 'user', content: 'test' }] })) {
      full += chunk.contentDelta ?? '';
    }

    expect(full).toBe('hello world');
  });

  it('5. GeminiProvider returns completion output cleanly on valid API response', async () => {
    const provider = new GeminiProvider({ apiKey: 'gemini-secret-key-123' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Response from Gemini' }] } }],
      }),
    });

    const res = await provider.generate({ messages: [{ role: 'user', content: 'hi' }] });
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Response from Gemini');
    }
  });

  it('6. LMStudioProvider completes request cleanly when fetch succeeds', async () => {
    const provider = new LMStudioProvider({ baseUrl: 'http://localhost:1234/v1' });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'LM Studio answer' } }],
      }),
    });

    const res = await provider.generate({ messages: [{ role: 'user', content: 'test' }] });
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('LM Studio answer');
    }
  });
});
