import { describe, it, expect } from 'vitest';
import { AssistantSecurityPolicy } from '../security/AssistantSecurityPolicy.js';

describe('AssistantSecurityPolicy Unit Tests', () => {
  it('redacts sensitive API keys and validates prompt strings', () => {
    const sensitiveKey = 'sk-proj-supersecretkey9999999999';
    const sanitized = AssistantSecurityPolicy.sanitize(`Using ${sensitiveKey}`);

    expect(sanitized).not.toContain(sensitiveKey);
    expect(sanitized).toContain('sk-***REDACTED***');

    expect(() => AssistantSecurityPolicy.validatePrompt('')).toThrow('cannot be empty');
  });

  it('handles empty text sanitization cleanly', () => {
    expect(AssistantSecurityPolicy.sanitize('')).toBe('');
  });

  it('rejects whitespace-only prompts', () => {
    expect(() => AssistantSecurityPolicy.validatePrompt('   ')).toThrow('cannot be empty');
  });
});
