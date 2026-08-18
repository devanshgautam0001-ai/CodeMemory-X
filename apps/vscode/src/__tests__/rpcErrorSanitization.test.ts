import { describe, it, expect, vi } from 'vitest';
import { MessageBridge } from '../bridge/MessageBridge.js';

describe('MessageBridge RPC Error & Path Sanitization Suite', () => {
  it('1. redacts secret tokens in RPC error responses', async () => {
    const mockPipeline = {
      getLiveSnapshot: vi.fn().mockImplementation(() => {
        throw new Error('Failed with key sk-proj-12345678901234567890 and Bearer eyJhbGciOiJIUzI1NiJ9');
      }),
    } as any;

    const bridge = new MessageBridge(mockPipeline);

    const res: any = await bridge.handleMessageFromWebview({
      requestId: 'req_sec_01',
      command: 'REQUEST_SNAPSHOT',
      payload: {},
    });

    expect(res).toBeDefined();
    expect(res.success).toBe(false);
    expect(res.error?.message).not.toContain('sk-proj-12345678901234567890');
    expect(res.error?.message).not.toContain('eyJhbGciOiJIUzI1NiJ9');
    expect(res.error?.message).toContain('sk-***REDACTED***');
    expect(res.error?.message).toContain('Bearer ***REDACTED***');
  });

  it('2. redacts absolute host system filesystem paths in RPC error responses', async () => {
    const mockPipeline = {
      getLiveSnapshot: vi.fn().mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory, open C:\\Users\\devan_fetqj2p\\Documents\\Secret.txt');
      }),
    } as any;

    const bridge = new MessageBridge(mockPipeline);

    const res: any = await bridge.handleMessageFromWebview({
      requestId: 'req_path_01',
      command: 'REQUEST_SNAPSHOT',
      payload: {},
    });

    expect(res).toBeDefined();
    expect(res.success).toBe(false);
    expect(res.error?.message).not.toContain('C:\\Users\\devan_fetqj2p');
    expect(res.error?.message).toContain('[PATH_REDACTED]');
  });
});
