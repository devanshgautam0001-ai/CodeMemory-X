import { describe, it, expect } from 'vitest';
import { AIProviderError } from '../errors/AIProviderError.js';

describe('AIProviderError Unit Tests', () => {
  it('instantiates AIProviderError with correct error fields and flags retryability', () => {
    const err = new AIProviderError({
      providerId: 'openai',
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded: 429',
      statusCode: 429,
      retryable: true,
    });

    expect(err.providerId).toBe('openai');
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.statusCode).toBe(429);
    expect(err.retryable).toBe(true);
    expect(err.message).toContain('[openai] RATE_LIMITED: Rate limit exceeded: 429');
  });

  it('sanitizes secrets and API keys from error messages automatically', () => {
    const rawMessage = 'Auth failed with key sk-proj-1234567890abcdefghijklmnopqrstuvwxyz and Bearer secret-token-xyz1234567890123';
    const sanitized = AIProviderError.sanitizeText(rawMessage);

    expect(sanitized).not.toContain('sk-proj-1234567890abcdefghijklmnopqrstuvwxyz');
    expect(sanitized).not.toContain('secret-token-xyz1234567890123');
    expect(sanitized).toContain('sk-***REDACTED***');
    expect(sanitized).toContain('Bearer ***REDACTED***');
  });
});
