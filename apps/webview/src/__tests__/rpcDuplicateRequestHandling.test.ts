import { describe, it, expect } from 'vitest';
import { rpcClient, RpcError } from '../rpc/WebviewRpcClient.js';

describe('WebviewRpcClient Duplicate Request ID Safety Suite', () => {
  it('1. rejects superceded request with RPC_STALE_REQUEST when duplicate requestId is submitted', async () => {
    const fixedReqId = 'req_dup_test_01';

    // Submit first request
    const p1 = rpcClient.sendRequest('REQUEST_SNAPSHOT', { requestId: fixedReqId });

    // Submit second request with SAME requestId before p1 completes
    const p2 = rpcClient.sendRequest('REQUEST_SNAPSHOT', { requestId: fixedReqId });

    // p1 should reject with RPC_STALE_REQUEST
    await expect(p1).rejects.toThrow();
    try {
      await p1;
    } catch (err: any) {
      expect(err).toBeInstanceOf(RpcError);
      expect(err.code).toBe('RPC_STALE_REQUEST');
    }

    // Clean up p2
    rpcClient.cancelRequest(fixedReqId);
    await expect(p2).rejects.toThrow();
  });
});
