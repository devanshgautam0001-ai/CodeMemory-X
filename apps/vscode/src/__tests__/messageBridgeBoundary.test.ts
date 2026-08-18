import { describe, it, expect, vi } from 'vitest';

vi.mock('vscode', () => ({
  Uri: { file: (path: string) => ({ fsPath: path }) },
  workspace: { getConfiguration: vi.fn() },
}));

import { MessageBridge } from '../bridge/MessageBridge.js';

describe('MessageBridge RPC Boundary & Validation Suite', () => {
  it('1. executes DELETE_ASSISTANT_CONVERSATION command successfully', async () => {
    const mockAssistantEngine = {
      deleteConversation: vi.fn(),
    };
    const mockPipeline = {
      getLiveSnapshot: vi.fn().mockResolvedValue({}),
      getAssistantEngine: () => mockAssistantEngine,
    } as any;

    const bridge = new MessageBridge(mockPipeline);

    const res: any = await bridge.handleMessageFromWebview({
      requestId: 'req_del_01',
      command: 'DELETE_ASSISTANT_CONVERSATION',
      payload: { conversationId: 'conv_to_delete' },
    });

    expect(res.success).toBe(true);
    expect(res.result).toEqual({ deleted: true, conversationId: 'conv_to_delete' });
    expect(mockAssistantEngine.deleteConversation).toHaveBeenCalledWith('conv_to_delete');
  });

  it('2. rejects oversized RPC payload (>2MB) with PAYLOAD_TOO_LARGE error', async () => {
    const bridge = new MessageBridge();

    // Create a 2.5MB payload string
    const oversizedPayload = { data: 'a'.repeat(2.5 * 1024 * 1024) };

    const res: any = await bridge.handleMessageFromWebview({
      requestId: 'req_large_01',
      command: 'REQUEST_SNAPSHOT',
      payload: oversizedPayload,
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
