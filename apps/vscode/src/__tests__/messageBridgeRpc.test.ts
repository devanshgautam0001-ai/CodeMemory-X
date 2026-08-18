import { describe, it, expect, vi } from 'vitest';
import { MessageBridge } from '../bridge/MessageBridge.js';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';

describe('MessageBridge RPC Protocol Unit Tests', () => {
  const mockPipeline = {
    getLiveSnapshot: vi.fn().mockResolvedValue({ memories: [1, 2] }),
    searchMemories: vi.fn().mockReturnValue([{ id: 'm1', summary: 'test' }]),
    getStory: vi.fn().mockResolvedValue({ symbolId: 'sym_1', name: 'Auth' }),
    getImpact: vi.fn().mockReturnValue({ totalAffectedEntities: 3 }),
    getDrift: vi.fn().mockReturnValue([{ id: 'd1', severity: 'HIGH' }]),
    getSession: vi.fn().mockReturnValue({ sessionId: 's1', state: 'IMPLEMENTING' }),
    recordDecision: vi.fn().mockResolvedValue({ id: 'dec_1', title: 'ADR 1' }),
  } as unknown as VerticalSlicePipeline;

  const bridge = new MessageBridge(mockPipeline);

  it('handles REQUEST_SNAPSHOT and returns typed WebviewRpcResponse', async () => {
    let capturedResponse: any;
    const resp = await bridge.handleMessageFromWebview(
      { requestId: 'req_01', command: 'REQUEST_SNAPSHOT', payload: { activePath: 'a.ts' } },
      (msg) => { capturedResponse = msg; }
    );

    expect(resp?.success).toBe(true);
    expect(resp?.requestId).toBe('req_01');
    expect(resp?.command).toBe('REQUEST_SNAPSHOT');
    expect(resp?.result.memories.length).toBe(2);
    expect(capturedResponse?.success).toBe(true);
  });

  it('handles SEARCH_MEMORIES RPC call', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_02',
      command: 'SEARCH_MEMORIES',
      payload: { query: 'auth' },
    });

    expect(resp?.success).toBe(true);
    expect(resp?.result[0].id).toBe('m1');
  });

  it('handles GET_STORY RPC call', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_03',
      command: 'GET_STORY',
      payload: { symbolId: 'sym_1' },
    });

    expect(resp?.success).toBe(true);
    expect(resp?.result.symbolId).toBe('sym_1');
  });

  it('handles GET_IMPACT RPC call', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_04',
      command: 'GET_IMPACT',
      payload: { filePath: 'src/service.ts' },
    });

    expect(resp?.success).toBe(true);
    expect(resp?.result.totalAffectedEntities).toBe(3);
  });

  it('handles GET_DRIFT RPC call', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_05',
      command: 'GET_DRIFT',
      payload: {},
    });

    expect(resp?.success).toBe(true);
    expect(resp?.result[0].id).toBe('d1');
  });

  it('handles GET_SESSION RPC call', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_06',
      command: 'GET_SESSION',
      payload: {},
    });

    expect(resp?.success).toBe(true);
    expect(resp?.result.sessionId).toBe('s1');
  });

  it('handles RECORD_DECISION RPC call', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_07',
      command: 'RECORD_DECISION',
      payload: { title: 'Use SQLite', rationale: 'Append only' },
    });

    expect(resp?.success).toBe(true);
    expect(resp?.result.id).toBe('dec_1');
  });

  it('handles SWITCH_TAB RPC call', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_08',
      command: 'SWITCH_TAB',
      payload: { tab: 'timeline' },
    });

    expect(resp?.success).toBe(true);
    expect(resp?.result.acknowledged).toBe(true);
  });

  it('rejects unknown commands with structured error response', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_err_01',
      command: 'INVALID_CMD' as any,
    });

    expect(resp?.success).toBe(false);
    expect(resp?.error?.code).toBe('UNKNOWN_COMMAND');
  });

  it('rejects malformed payloads with structured error response', async () => {
    const resp = await bridge.handleMessageFromWebview({
      requestId: 'req_err_02',
      command: 'GET_STORY',
      payload: {},
    });

    expect(resp?.success).toBe(false);
    expect(resp?.error?.code).toBe('EXECUTION_ERROR');
    expect(resp?.error?.message).toContain('symbolId');
  });
});
