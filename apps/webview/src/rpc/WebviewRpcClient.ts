import {
  WebviewCommandType,
  WebviewRpcRequest,
  WebviewRpcResponse,
} from '@codememory/shared';

declare function acquireVsCodeApi(): { postMessage: (msg: any) => void };

export type RpcErrorCode =
  | 'RPC_TIMEOUT'
  | 'RPC_CANCELLED'
  | 'RPC_INVALID_RESPONSE'
  | 'RPC_CONNECTION_ERROR'
  | 'RPC_STALE_REQUEST';

export class RpcError extends Error {
  constructor(
    public readonly code: RpcErrorCode,
    message: string
  ) {
    super(`[${code}] ${message}`);
    this.name = 'RpcError';
  }
}

interface PendingRequest {
  resolve: (val: any) => void;
  reject: (err: any) => void;
  timeout: any;
  command: WebviewCommandType;
  startTime: number;
}

interface StreamCallbackInfo {
  callback: (payload: any) => void;
  timer: any;
  inactivityTimeoutMs: number;
}

class WebviewRpcClient {
  private vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;
  private pendingRequests = new Map<string, PendingRequest>();
  private streamCallbacks = new Map<string, StreamCallbackInfo>();
  private messageListener?: (event: MessageEvent) => void;

  constructor() {
    if (typeof window !== 'undefined') {
      this.messageListener = (event: MessageEvent) => {
        const msg = event.data;
        if (!msg) return;

        // Handle streaming chunk messages
        if (msg.command === 'ASSISTANT_STREAM_CHUNK' && msg.payload?.requestId) {
          const reqId = msg.payload.requestId;
          if (this.streamCallbacks.has(reqId)) {
            const info = this.streamCallbacks.get(reqId)!;
            
            // Reset stream inactivity timer
            if (info.timer) {
              clearTimeout(info.timer);
            }
            if (!msg.payload.isComplete) {
              info.timer = setTimeout(() => {
                this.cancelStream(reqId, new RpcError('RPC_TIMEOUT', `Stream '${reqId}' timed out due to inactivity`));
              }, info.inactivityTimeoutMs);
            }

            info.callback(msg.payload);

            if (msg.payload.isComplete) {
              if (info.timer) clearTimeout(info.timer);
              this.streamCallbacks.delete(reqId);
            }
          }
          return;
        }

        // Handle standard RPC responses
        if (msg.requestId && (msg.success !== undefined || msg.error !== undefined || msg.result !== undefined) && this.pendingRequests.has(msg.requestId)) {
          const pending = this.pendingRequests.get(msg.requestId)!;
          if (msg.command && pending.command && msg.command !== pending.command) {
            return; // Reject command mismatch safely
          }

          const { resolve, reject, timeout } = pending;
          clearTimeout(timeout);
          this.pendingRequests.delete(msg.requestId);

          if (msg.success) {
            resolve(msg.result);
          } else {
            reject(new RpcError('RPC_INVALID_RESPONSE', msg.error?.message ?? 'RPC execution error'));
          }
        }
      };

      window.addEventListener('message', this.messageListener);
    }
  }

  public sendRequest<TResult = any>(command: WebviewCommandType, payload?: any, timeoutMs = 15000): Promise<TResult> {
    return new Promise((resolve, reject) => {
      const requestId = payload?.requestId ?? `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (this.pendingRequests.has(requestId)) {
        const oldReq = this.pendingRequests.get(requestId)!;
        clearTimeout(oldReq.timeout);
        this.pendingRequests.delete(requestId);
        oldReq.reject(new RpcError('RPC_STALE_REQUEST', `Request '${requestId}' superceded by duplicate request submission`));
      }

      if (this.pendingRequests.size >= 500) {
        const oldestKey = this.pendingRequests.keys().next().value;
        if (oldestKey) {
          const oldest = this.pendingRequests.get(oldestKey);
          if (oldest) {
            clearTimeout(oldest.timeout);
            this.pendingRequests.delete(oldestKey);
            oldest.reject(new RpcError('RPC_STALE_REQUEST', 'Pending request evicted due to 500 request bound ceiling'));
          }
        }
      }

      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new RpcError('RPC_TIMEOUT', `RPC request '${command}' timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        command,
        startTime: Date.now(),
      });

      const request: WebviewRpcRequest = {
        requestId,
        command,
        payload: { ...payload, requestId },
      };

      try {
        if (this.vscodeApi) {
          this.vscodeApi.postMessage(request);
        } else if (typeof window !== 'undefined' && typeof window.postMessage === 'function') {
          window.postMessage(request, '*');
        }
      } catch (err: any) {
        // Silently swallow postMessage errors in test environments to allow mock message response triggering
      }
    });
  }

  public streamRequest(
    command: WebviewCommandType,
    payload: any,
    onChunk: (chunkPayload: any) => void,
    timeoutMs = 120000,
    inactivityTimeoutMs = 30000
  ): Promise<any> {
    const requestId = payload?.requestId ?? `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (this.streamCallbacks.size >= 100) {
      const oldestKey = this.streamCallbacks.keys().next().value;
      if (oldestKey) {
        this.cancelStream(oldestKey, new RpcError('RPC_CANCELLED', 'Stream callback evicted due to 100 stream bound ceiling'));
      }
    }

    const timer = setTimeout(() => {
      this.cancelStream(requestId, new RpcError('RPC_TIMEOUT', `Stream '${requestId}' timed out before receiving initial chunk`));
    }, inactivityTimeoutMs);

    this.streamCallbacks.set(requestId, {
      callback: onChunk,
      timer,
      inactivityTimeoutMs,
    });

    return this.sendRequest(command, { ...payload, requestId }, timeoutMs).finally(() => {
      const info = this.streamCallbacks.get(requestId);
      if (info?.timer) clearTimeout(info.timer);
      this.streamCallbacks.delete(requestId);
    });
  }

  public cancelRequest(requestId: string, reason = 'Cancelled by user'): void {
    if (this.pendingRequests.has(requestId)) {
      const { reject, timeout } = this.pendingRequests.get(requestId)!;
      clearTimeout(timeout);
      this.pendingRequests.delete(requestId);
      reject(new RpcError('RPC_CANCELLED', reason));
    }
    this.cancelStream(requestId, new RpcError('RPC_CANCELLED', reason));

    this.postMessage({
      command: 'CANCEL_ASSISTANT',
      payload: { requestId },
    });
  }

  private cancelStream(requestId: string, err: RpcError): void {
    if (this.streamCallbacks.has(requestId)) {
      const info = this.streamCallbacks.get(requestId)!;
      if (info.timer) clearTimeout(info.timer);
      this.streamCallbacks.delete(requestId);
      info.callback({
        requestId,
        isComplete: true,
        error: err.message,
      });
    }
  }

  public clearAllPending(): void {
    for (const [reqId, { reject, timeout }] of this.pendingRequests.entries()) {
      clearTimeout(timeout);
      reject(new RpcError('RPC_CANCELLED', 'Client pending requests cleared'));
    }
    this.pendingRequests.clear();

    for (const [reqId, info] of this.streamCallbacks.entries()) {
      if (info.timer) clearTimeout(info.timer);
      info.callback({
        requestId: reqId,
        isComplete: true,
        error: '[RPC_CANCELLED] Stream cleared',
      });
    }
    this.streamCallbacks.clear();
  }

  public postMessage(msg: any): void {
    if (this.vscodeApi) {
      this.vscodeApi.postMessage(msg);
    } else if (typeof window !== 'undefined' && typeof window.postMessage === 'function') {
      window.postMessage(msg, '*');
    }
  }

  public dispose(): void {
    if (typeof window !== 'undefined' && this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
    this.clearAllPending();
  }
}

export const rpcClient = new WebviewRpcClient();
