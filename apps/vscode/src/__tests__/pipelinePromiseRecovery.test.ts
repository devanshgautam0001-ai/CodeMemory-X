import { describe, it, expect, vi } from 'vitest';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';

describe('VerticalSlicePipeline Promise Recovery', () => {
  it('should recover processingPromise chain after a file processing failure', async () => {
    const pipeline = new VerticalSlicePipeline();

    // Mock internal executeProcessFile to throw once then succeed
    let callCount = 0;
    vi.spyOn(pipeline as any, 'executeProcessFile').mockImplementation(async (...args: any[]) => {
      const filePath = args[0] as string;
      callCount++;
      if (callCount === 1) {
        throw new Error('Simulated WASM write error');
      }
      return { memories: [], timelineData: {}, symbolStory: null, knowledgeGraph: {}, driftFindings: [] } as any;
    });

    // First call throws
    await expect(pipeline.processTypeScriptFile('file1.ts')).rejects.toThrow('Simulated WASM write error');

    // Second call should NOT be permanently rejected; it should recover and execute
    const res2 = await pipeline.processTypeScriptFile('file2.ts');
    expect(res2).toBeDefined();
    expect(callCount).toBe(2);
  });
});
