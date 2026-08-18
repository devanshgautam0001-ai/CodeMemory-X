import { describe, it, expect } from 'vitest';
import { rpcClient, RpcError } from '../rpc/WebviewRpcClient.js';

describe('WebviewRpcClient Correlation & Bounds Hardening', () => {
  it('should enforce pending requests map capacity bounds', async () => {
    // Submit 510 request promises without completing them
    const promises: Promise<any>[] = [];
    for (let i = 1; i <= 510; i++) {
      promises.push(rpcClient.sendRequest('REQUEST_SNAPSHOT', { requestId: `req_b_${i}` }, 60000));
    }

    // Attach catch handlers to prevent unhandled promise rejections on test cleanup
    promises.forEach((p) => p.catch(() => {}));

    // Oldest requests should have been rejected with RPC_STALE_REQUEST due to eviction
    await expect(promises[0]).rejects.toThrow('RPC_STALE_REQUEST');

    // Clean up remaining pending requests
    rpcClient.clearAllPending();
  });

  it('should support dispose() method cleanly', () => {
    expect(typeof rpcClient.dispose).toBe('function');
    rpcClient.dispose();
  });
});
