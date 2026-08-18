import { describe, it, expect, vi } from 'vitest';
import { DefaultRetryPolicy } from '../resilience/DefaultResilience.js';
import { AIProviderError } from '../errors/AIProviderError.js';

describe('DefaultRetryPolicy Unit Tests', () => {
  it('retries transient retryable errors up to maxRetries', async () => {
    const policy = new DefaultRetryPolicy(3, 10);
    let attempts = 0;

    const result = await policy.executeWithRetry(async () => {
      attempts++;
      if (attempts < 3) {
        throw new AIProviderError({
          providerId: 'test',
          code: 'RATE_LIMITED',
          message: 'Transient limit',
          retryable: true,
        });
      }
      return 'success';
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('does NOT retry non-retryable authentication or validation errors', async () => {
    const policy = new DefaultRetryPolicy(3, 10);
    let attempts = 0;

    await expect(
      policy.executeWithRetry(async () => {
        attempts++;
        throw new AIProviderError({
          providerId: 'test',
          code: 'AUTHENTICATION_ERROR',
          message: 'Invalid API key',
          retryable: false,
        });
      })
    ).rejects.toThrow('AUTHENTICATION_ERROR');

    expect(attempts).toBe(1);
  });
});
