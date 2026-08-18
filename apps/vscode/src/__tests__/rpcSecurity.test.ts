import { describe, it, expect, vi } from 'vitest';
import { MessageBridge } from '../bridge/MessageBridge.js';

describe('TASK-059 RPC Security, Boundary & Validation Suite', () => {
  it('1. rejects non-object message with INVALID_MSG error code', async () => {
    const bridge = new MessageBridge();
    const res: any = await bridge.handleMessageFromWebview('invalid_string_message');

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('INVALID_MSG');
  });

  it('2. rejects null message with INVALID_MSG error code', async () => {
    const bridge = new MessageBridge();
    const res: any = await bridge.handleMessageFromWebview(null);

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('INVALID_MSG');
  });

  it('3. rejects unknown command with UNKNOWN_COMMAND error code', async () => {
    const bridge = new MessageBridge();
    const res: any = await bridge.handleMessageFromWebview({
      command: 'UNSUPPORTED_MALICIOUS_COMMAND',
      requestId: 'req_hack_01',
    });

    expect(res.success).toBe(false);
    expect(res.error?.code).toBe('UNKNOWN_COMMAND');
    expect(res.requestId).toBe('req_hack_01');
  });

  it('4. converts array or primitive payload safely to object without throwing', async () => {
    const mockPipeline = {
      getLiveSnapshot: vi.fn().mockResolvedValue({ memories: [] }),
    };

    const bridge = new MessageBridge(mockPipeline as any);
    const res: any = await bridge.handleMessageFromWebview({
      command: 'REQUEST_SNAPSHOT',
      requestId: 'req_test_array',
      payload: ['item1', 'item2'], // Array payload
    });

    expect(res.success).toBe(true);
    expect(mockPipeline.getLiveSnapshot).toHaveBeenCalledWith(undefined);
  });

  it('5. trims whitespace requestId and generates valid fallback when empty', async () => {
    const mockPipeline = {
      getLiveSnapshot: vi.fn().mockResolvedValue({ memories: [] }),
    };

    const bridge = new MessageBridge(mockPipeline as any);
    const res: any = await bridge.handleMessageFromWebview({
      command: 'REQUEST_SNAPSHOT',
      requestId: '   ',
      payload: {},
    });

    expect(res.success).toBe(true);
    expect(res.requestId).toMatch(/^req_\d+/);
  });
});
