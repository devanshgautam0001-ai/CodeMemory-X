import { describe, it, expect, vi } from 'vitest';
import { PipelineCoordinator } from '../coordinator/PipelineCoordinator.js';
import { WorkspaceEvent } from '@codememory/workspace-watcher';

describe('PipelineCoordinator', () => {
  it('should process a WorkspaceEvent through all pipeline stages', async () => {
    const coordinator = new PipelineCoordinator();

    const event: WorkspaceEvent = {
      timestamp: new Date().toISOString(),
      workspace: '/workspace/project',
      file: '/workspace/project/src/auth.ts',
      eventType: 'FILE_MODIFIED',
      metadata: {},
    };

    const res = await coordinator.processEvent(event);
    expect(res.isSuccess).toBe(true);

    if (res.isSuccess) {
      const intelligence = res.value;
      expect(intelligence.metrics.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(intelligence.metrics.stageDurations).toHaveLength(7);
      expect(intelligence.metrics.filesProcessed).toBe(1);
      expect(intelligence.symbolGraph).toBeDefined();
    }
  });
});
