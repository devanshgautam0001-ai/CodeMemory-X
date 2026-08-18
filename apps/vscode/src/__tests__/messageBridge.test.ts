import { describe, it, expect, vi } from 'vitest';
import { MessageBridge } from '../bridge/MessageBridge.js';
import { ConsoleLogger } from '@codememory/logging';

describe('MessageBridge Unit Tests', () => {
  it('should handle SWITCH_TAB cleanly without requiring a pipeline', async () => {
    const logger = new ConsoleLogger();
    const bridge = new MessageBridge(logger);

    const res: any = await bridge.handleMessageFromWebview({ requestId: 'r1', command: 'SWITCH_TAB', payload: { tab: 'timeline' } });
    // TASK-059: SWITCH_TAB is a UI-only command that works without a pipeline
    expect(res).toBeDefined();
    expect(res.success).toBe(true);
    expect(res.result?.tab).toBe('timeline');
    expect(res.result?.acknowledged).toBe(true);
  });

  it('should dispatch postMessage to webview cleanly', () => {
    const bridge = new MessageBridge();
    const mockPostMessage = vi.fn();

    bridge.sendToWebview(mockPostMessage, 'pong', { ok: true });
    expect(mockPostMessage).toHaveBeenCalledWith({
      command: 'pong',
      payload: { ok: true },
    });
  });

  it('should handle STREAM_ASSISTANT RPC command using pipeline assistantEngine', async () => {
    const mockAssistantEngine = {
      getContext: vi.fn().mockResolvedValue({ totalTokens: 100 }),
      stream: async function* () {
        yield { contentDelta: 'Hello ' };
        yield { contentDelta: 'world!' };
      },
    };

    const mockPipeline = {
      getLiveSnapshot: vi.fn(),
      getAssistantEngine: vi.fn().mockReturnValue(mockAssistantEngine),
    } as any;

    const bridge = new MessageBridge(mockPipeline);
    const postMessageSpy = vi.fn();

    const res = await bridge.handleMessageFromWebview(
      {
        requestId: 'req_s1',
        command: 'STREAM_ASSISTANT',
        payload: { prompt: 'Test stream prompt' },
      },
      postMessageSpy
    );

    expect(res).toBeDefined();
    expect(postMessageSpy).toHaveBeenCalled();
    const streamCalls = postMessageSpy.mock.calls.filter((c) => c[0]?.command === 'ASSISTANT_STREAM_CHUNK');
    expect(streamCalls.length).toBeGreaterThan(1);
  });
});
