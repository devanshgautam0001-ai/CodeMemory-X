import { describe, it, expect, vi } from 'vitest';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';

describe('VerticalSlicePipeline Idempotent Teardown Suite', () => {
  it('1. dispose() executes teardown once and is idempotent when called repeatedly', async () => {
    const pipeline = new VerticalSlicePipeline();
    const mockFlush = vi.fn().mockResolvedValue(undefined);
    const mockClose = vi.fn();

    (pipeline as any).eventStore = {
      flush: mockFlush,
      close: mockClose,
    };

    // First call
    await pipeline.dispose();
    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);

    // Second call — should return immediately without re-executing flush or close
    await pipeline.dispose();
    expect(mockFlush).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
