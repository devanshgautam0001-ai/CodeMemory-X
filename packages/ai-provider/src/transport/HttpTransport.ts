import { AIProviderError, AIProviderErrorCode } from '../errors/AIProviderError.js';
import { ILogger } from '@codememory/logging';

export interface HttpTransportOptions {
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  providerId: string;
  signal?: AbortSignal;
}

export class HttpTransport {
  constructor(private readonly logger?: ILogger) {}

  public async postJson<T>(options: HttpTransportOptions): Promise<T> {
    const { url, headers, body, timeoutMs = 30000, providerId, signal: userSignal } = options;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const onAbort = () => controller.abort();
    if (userSignal) {
      userSignal.addEventListener('abort', onAbort);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);
      if (userSignal) userSignal.removeEventListener('abort', onAbort);

      if (!response.ok) {
        let errText = '';
        try {
          errText = await response.text();
        } catch {
          errText = response.statusText;
        }

        const { code, retryable } = this.mapStatusToErrorCode(response.status);
        throw new AIProviderError({
          providerId,
          code,
          message: `HTTP ${response.status}: ${errText}`,
          statusCode: response.status,
          retryable,
        });
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (userSignal) userSignal.removeEventListener('abort', onAbort);

      if (err instanceof AIProviderError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new AIProviderError({
          providerId,
          code: userSignal?.aborted ? 'ABORTED' : 'TIMEOUT',
          message: userSignal?.aborted ? 'Request aborted by caller' : `Request timed out after ${timeoutMs}ms`,
          retryable: !userSignal?.aborted,
        });
      }

      if (err instanceof SyntaxError || err.name === 'SyntaxError') {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_RESPONSE',
          message: `Failed to parse response JSON: ${err.message}`,
          retryable: false,
          cause: err,
        });
      }

      throw new AIProviderError({
        providerId,
        code: 'NETWORK_ERROR',
        message: err.message ?? 'Network connection failed',
        retryable: true,
        cause: err,
      });
    }
  }

  public async *postStream<T = string>(
    options: HttpTransportOptions,
    parseChunk: (line: string) => T | null
  ): AsyncIterableIterator<T> {
    const { url, headers, body, timeoutMs = 60000, providerId, signal: userSignal } = options;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const onAbort = () => controller.abort();
    if (userSignal) {
      userSignal.addEventListener('abort', onAbort);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errText = '';
        try {
          errText = await response.text();
        } catch {
          errText = response.statusText;
        }
        const { code, retryable } = this.mapStatusToErrorCode(response.status);
        throw new AIProviderError({
          providerId,
          code,
          message: `HTTP ${response.status}: ${errText}`,
          statusCode: response.status,
          retryable,
        });
      }

      if (!response.body) {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_RESPONSE',
          message: 'Provider returned an empty response body for streaming request',
        });
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const content = parseChunk(trimmed);
          if (content !== null) {
            yield content;
          }
        }
      }

      if (buffer.trim()) {
        const content = parseChunk(buffer.trim());
        if (content !== null) {
          yield content;
        }
      }
    } catch (err: any) {
      clearTimeout(timer);
      if (userSignal) userSignal.removeEventListener('abort', onAbort);

      if (err instanceof AIProviderError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new AIProviderError({
          providerId,
          code: userSignal?.aborted ? 'ABORTED' : 'TIMEOUT',
          message: userSignal?.aborted ? 'Streaming request aborted by caller' : `Streaming request timed out after ${timeoutMs}ms`,
          retryable: !userSignal?.aborted,
        });
      }

      if (err instanceof SyntaxError || err.name === 'SyntaxError') {
        throw new AIProviderError({
          providerId,
          code: 'INVALID_RESPONSE',
          message: `Failed to parse streaming response JSON: ${err.message}`,
          retryable: false,
          cause: err,
        });
      }

      throw new AIProviderError({
        providerId,
        code: 'NETWORK_ERROR',
        message: err.message ?? 'Network connection failed during streaming',
        retryable: true,
        cause: err,
      });
    }
  }

  private mapStatusToErrorCode(status: number): { code: AIProviderErrorCode; retryable: boolean } {
    switch (status) {
      case 401: return { code: 'AUTHENTICATION_ERROR', retryable: false };
      case 403: return { code: 'AUTHORIZATION_ERROR', retryable: false };
      case 404: return { code: 'MODEL_NOT_FOUND', retryable: false };
      case 408: return { code: 'TIMEOUT', retryable: true };
      case 429: return { code: 'RATE_LIMITED', retryable: true };
      case 400:
      case 422: return { code: 'INVALID_REQUEST', retryable: false };
      case 500:
      case 502:
      case 503:
      case 504: return { code: 'PROVIDER_UNAVAILABLE', retryable: true };
      default: return { code: 'UNKNOWN', retryable: false };
    }
  }
}
