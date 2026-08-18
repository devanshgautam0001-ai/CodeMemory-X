import { describe, it, expect } from 'vitest';
import { ok, fail } from '../result.js';

describe('Result Type Utility', () => {
  it('should handle success results correctly', () => {
    const res = ok('memory_ready');
    expect(res.isSuccess).toBe(true);
    expect(res.isFailure).toBe(false);
    if (res.isSuccess) {
      expect(res.value).toBe('memory_ready');
    }
  });

  it('should handle failure results correctly', () => {
    const err = new Error('Storage write failed');
    const res = fail(err);
    expect(res.isSuccess).toBe(false);
    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      expect(res.error.message).toBe('Storage write failed');
    }
  });
});
