import { describe, it, expect } from 'vitest';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';

describe('VerticalSlicePipeline Post-Disposal Guard', () => {
  it('should reject recordDecision when invoked on disposed pipeline', async () => {
    const pipeline = new VerticalSlicePipeline();
    await pipeline.dispose();

    await expect(pipeline.recordDecision('Title', 'Reason', [])).rejects.toThrow(
      'Cannot record decision on disposed or uninitialized pipeline'
    );
  });
});
