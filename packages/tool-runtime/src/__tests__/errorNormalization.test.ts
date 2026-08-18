import { describe, it, expect } from 'vitest';
import { ToolExecutionError } from '../types/ToolExecutionError.js';

describe('ToolExecutionError Normalization Unit Tests', () => {
  it('normalizes error details and automatically redacts API keys', () => {
    const sensitive = 'sk-proj-secret999999999999999999';
    const err = new ToolExecutionError({
      toolName: 'my_tool',
      code: 'EXECUTION_FAILED',
      message: `Failed using key ${sensitive}`,
    });

    expect(err.code).toBe('EXECUTION_FAILED');
    expect(err.message).not.toContain(sensitive);
    expect(err.message).toContain('sk-***REDACTED***');
  });
});
