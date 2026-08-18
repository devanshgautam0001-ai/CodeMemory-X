import { Result } from '@codememory/shared';

export interface IRetryPolicy {
  executeWithRetry<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T>;
}

export interface ICircuitBreaker {
  canExecute(): boolean;
  onSuccess(): void;
  onFailure(): void;
}

export interface IRateLimiter {
  acquireToken(): Promise<void>;
}

export interface ITokenAccounting {
  recordUsage(providerId: string, model: string, promptTokens: number, completionTokens: number): void;
}

export interface IRequestLogger {
  logRequest(providerId: string, model: string, payload: unknown): void;
  logResponse(providerId: string, model: string, response: unknown, durationMs: number): void;
}

export interface IResponseCache {
  get<T>(cacheKey: string): Promise<T | undefined>;
  set<T>(cacheKey: string, value: T, ttlMs?: number): Promise<void>;
}
