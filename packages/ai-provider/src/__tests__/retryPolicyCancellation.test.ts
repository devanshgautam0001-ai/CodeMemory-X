import { describe, it, expect } from 'vitest';
import { DefaultRetryPolicy } from '../resilience/DefaultResilience.js';
import { AIProviderError } from '../errors/AIProviderError.js';

describe('DefaultRetryPolicy Cancellation Support', () => {
  it('should abort backoff delay immediately when caller AbortSignal triggers', async () => {
    const policy = new DefaultRetryPolicy(3, 5000); // 5s backoff delay
    const controller = new AbortController();

    let attempts = 0;
    const failingFn = async () => {
      attempts++;
      throw new AIProviderError({
        providerId: 'mock',
        code: 'RATE_LIMITED',
        message: 'Rate limit exceeded',
        retryable: true,
      });
    };

    const start = Date.now();
    const retryPromise = policy.executeWithRetry(failingFn, controller.signal);

    // Abort after 50ms while sleeping in backoff
    setTimeout(() => {
      controller.abort();
    }, 50);

    try {
      await retryPromise;
      expect.fail('Should have thrown cancellation error');
    } catch (err: any) {
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Exited backoff delay immediately
      expect(err).toBeInstanceOf(AIProviderError);
      expect(err.code).toBe('ABORTED');
    }
  });
});
