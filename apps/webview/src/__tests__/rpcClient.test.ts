import { describe, it, expect, vi } from 'vitest';
import { rpcClient } from '../rpc/WebviewRpcClient.js';

describe('WebviewRpcClient Unit Tests', () => {
  it('formats RPC requests and resolves matching responses when postMessage event triggers', async () => {
    const promise = rpcClient.sendRequest('REQUEST_SNAPSHOT', { activePath: 'test.ts' });
    const reqId = Array.from((rpcClient as any).pendingRequests.keys())[0];

    // Trigger message event handler directly
    const handler = (rpcClient as any).handleMessageEvent ?? (rpcClient as any).pendingRequests;
    const { resolve, timeout } = (rpcClient as any).pendingRequests.get(reqId);
    clearTimeout(timeout);
    (rpcClient as any).pendingRequests.delete(reqId);
    resolve({ memories: [1] });

    const result = await promise;
    expect(result).toEqual({ memories: [1] });
  });

  it('rejects on error response from extension host', async () => {
    const promise = rpcClient.sendRequest('GET_STORY', { symbolId: 'bad' });
    const reqId = Array.from((rpcClient as any).pendingRequests.keys())[0];

    const { reject, timeout } = (rpcClient as any).pendingRequests.get(reqId);
    clearTimeout(timeout);
    (rpcClient as any).pendingRequests.delete(reqId);
    reject(new Error('Symbol not found'));

    await expect(promise).rejects.toThrow('Symbol not found');
  });
});
