import {
  IRetryPolicy,
  ICircuitBreaker,
  IRateLimiter,
  ITokenAccounting,
  IRequestLogger,
} from '../future/FutureResilienceInterfaces.js';
import { AIProviderError } from '../errors/AIProviderError.js';
import { ILogger } from '@codememory/logging';

export class DefaultRetryPolicy implements IRetryPolicy {
  constructor(
    private readonly maxRetries = 3,
    private readonly baseDelayMs = 200,
    private readonly logger?: ILogger
  ) {}

  public async executeWithRetry<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    let attempt = 0;
    while (true) {
      if (signal?.aborted) {
        throw new AIProviderError({
          providerId: 'retry-policy',
          code: 'ABORTED',
          message: 'Request aborted by caller prior to retry attempt',
          retryable: false,
        });
      }
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const isRetryable = err instanceof AIProviderError ? err.retryable : true;
        if (attempt > this.maxRetries || !isRetryable || signal?.aborted) {
          throw err;
        }

        const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
        this.logger?.warn(`[DefaultRetryPolicy] Retrying request (attempt ${attempt}/${this.maxRetries}) after ${delay}ms`, { error: err.message });
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, delay);
          if (signal) {
            const onAbort = () => {
              clearTimeout(timer);
              reject(
                new AIProviderError({
                  providerId: 'retry-policy',
                  code: 'ABORTED',
                  message: 'Request aborted by caller during backoff delay',
                  retryable: false,
                })
              );
            };
            signal.addEventListener('abort', onAbort, { once: true });
          }
        });
      }
    }
  }
}

export class DefaultCircuitBreaker implements ICircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttemptTime = 0;

  constructor(
    private readonly failureThreshold = 5,
    private readonly cooldownMs = 30000,
    private readonly logger?: ILogger
  ) {}

  public canExecute(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        this.logger?.info('[DefaultCircuitBreaker] Transitioning to HALF_OPEN state');
        return true;
      }
      return false;
    }
    return true;
  }

  public onSuccess(): void {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.logger?.info('[DefaultCircuitBreaker] Transitioning to CLOSED state after successful recovery');
    }
  }

  public onFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.cooldownMs;
      this.logger?.warn(`[DefaultCircuitBreaker] Circuit OPENED after ${this.failureCount} failures. Cooldown: ${this.cooldownMs}ms`);
    }
  }
}

export class DefaultRateLimiter implements IRateLimiter {
  private activeRequests = 0;

  constructor(private readonly maxConcurrency = 10) {}

  public async acquireToken(): Promise<void> {
    while (this.activeRequests >= this.maxConcurrency) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.activeRequests++;
  }

  public releaseToken(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
  }
}

export interface TokenUsageRecord {
  providerId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  recordedAt: string;
}

export class DefaultTokenAccounting implements ITokenAccounting {
  private records: TokenUsageRecord[] = [];

  public recordUsage(
    providerId: string,
    model: string,
    promptTokens: number,
    completionTokens: number
  ): void {
    if (this.records.length >= 5000) {
      this.records.shift();
    }
    this.records.push({
      providerId,
      model,
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      recordedAt: new Date().toISOString(),
    });
  }

  public getRecords(): TokenUsageRecord[] {
    return [...this.records];
  }
}

export class DefaultRequestLogger implements IRequestLogger {
  constructor(private readonly logger?: ILogger) {}

  public logRequest(providerId: string, model: string, payload: unknown): void {
    this.logger?.info(`[IRequestLogger] Outgoing request to [${providerId}] model: ${model}`);
  }

  public logResponse(providerId: string, model: string, response: unknown, durationMs: number): void {
    this.logger?.info(`[IRequestLogger] Received response from [${providerId}] model: ${model} (${durationMs}ms)`);
  }
}
