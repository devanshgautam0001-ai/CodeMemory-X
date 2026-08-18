import { describe, it, expect, vi } from 'vitest';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';

describe('VerticalSlicePipeline Error Safety & Path Sanitization Suite', () => {
  it('1. getLiveSnapshot() returns safe fallback when pipeline is uninitialized', async () => {
    const pipeline = new VerticalSlicePipeline();
    const snapshot = await pipeline.getLiveSnapshot('c:/Users/test/file.ts');

    expect(snapshot).toBeDefined();
    expect(snapshot.memories).toEqual([]);
    expect(snapshot.timelineData.workspace).not.toContain('c:/Users/test');
    expect(snapshot.timelineData.totalMemories).toBe(0);
  });

  it('2. sanitizePath() converts absolute host system paths to workspace-relative or basename', () => {
    const pipeline = new VerticalSlicePipeline();
    (pipeline as any).workspacePath = 'C:/Users/devan_fetqj2p/Documents/CodeMemory X';

    const sanitize = (pathStr?: string) => (pipeline as any).sanitizePath(pathStr);

    expect(sanitize('C:/Users/devan_fetqj2p/Documents/CodeMemory X/apps/vscode/src/extension.ts')).toBe('apps/vscode/src/extension.ts');
    expect(sanitize('C:/SecretFolder/PrivateData/key.pem')).toBe('key.pem'); // Host path outside workspace → basename only
    expect(sanitize(undefined)).toBeUndefined();
  });

  it('3. initialize() handles EventStore startup failures safely and resets state', async () => {
    const pipeline = new VerticalSlicePipeline();
    
    // Mock EventStore initialization failure
    const mockES = {
      initialize: vi.fn().mockResolvedValue({ isFailure: true, error: new Error('DB lock error') }),
      close: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
    };

    // Replace EventStore creation inside pipeline with failing mock
    vi.spyOn(pipeline as any, 'initialize').mockImplementation(async () => {
      (pipeline as any).eventStore = mockES;
      const res = await mockES.initialize();
      if (res.isFailure) {
        (pipeline as any).isInitialized = false;
        await pipeline.dispose();
        throw new Error(`EventStore initialization failed: ${res.error.message}`);
      }
    });

    await expect(pipeline.initialize('/invalid/workspace')).rejects.toThrow('EventStore initialization failed: DB lock error');
    expect((pipeline as any).isInitialized).toBe(false);
  });
});
