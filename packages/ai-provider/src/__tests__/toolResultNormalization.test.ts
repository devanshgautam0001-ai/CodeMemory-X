import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAIProvider, ClaudeProvider } from '../adapters/CloudAndLocalAdapters1.js';
import { IAIRequest } from '../types/IAIRequest.js';

describe('ToolResult Normalization Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('formats toolResults correctly for OpenAI role: "tool"', async () => {
    let capturedBody: any;
    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Done' } }] }) };
    });

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Run search' }],
      toolResults: [
        {
          toolCallId: 'call_123',
          content: { symbol: 'MemoryEngine', count: 5 },
        },
      ],
    };

    await provider.generate(req);

    const toolMsg = capturedBody.messages.find((m: any) => m.role === 'tool');
    expect(toolMsg).toBeDefined();
    expect(toolMsg.tool_call_id).toBe('call_123');
    expect(toolMsg.content).toContain('MemoryEngine');
  });

  it('formats toolResults correctly for Claude type: "tool_result"', async () => {
    let capturedBody: any;
    globalThis.fetch = vi.fn().mockImplementation(async (url, init) => {
      capturedBody = JSON.parse(init.body);
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Claude done' }] }) };
    });

    const provider = new ClaudeProvider({ apiKey: 'sk-test' });
    const req: IAIRequest = {
      messages: [{ role: 'user', content: 'Run tool' }],
      toolResults: [
        {
          toolCallId: 'toolu_abc',
          content: 'Search output',
        },
      ],
    };

    await provider.generate(req);

    const userMsg = capturedBody.messages[capturedBody.messages.length - 1];
    expect(userMsg.content[0].type).toBe('tool_result');
    expect(userMsg.content[0].tool_use_id).toBe('toolu_abc');
  });
});
