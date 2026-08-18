import { describe, it, expect, vi } from 'vitest';
import { InMemoryEventBus } from '../services/InMemoryEventBus.js';

describe('EventBus History Replay', () => {
  it('should replay historical events to target handler', async () => {
    const bus = new InMemoryEventBus();

    await bus.publish({
      id: 'e1',
      type: 'WORKSPACE_OPEN',
      source: 'workspace-watcher',
      timestamp: '2026-08-07T19:00:00Z',
      correlationId: 'corr-1',
      payload: { path: '/workspace' },
      metadata: {},
    });

    await bus.publish({
      id: 'e2',
      type: 'FILE_MODIFIED',
      source: 'workspace-watcher',
      timestamp: '2026-08-07T19:01:00Z',
      correlationId: 'corr-1',
      payload: { file: 'index.ts' },
      metadata: {},
    });

    const replayHandler = vi.fn();
    const replayRes = await bus.replay({ eventType: 'FILE_MODIFIED' }, replayHandler);

    expect(replayRes.isSuccess).toBe(true);
    if (replayRes.isSuccess) {
      expect(replayRes.value).toBe(1);
    }
    expect(replayHandler).toHaveBeenCalledTimes(1);
    expect(replayHandler.mock.calls[0][0].id).toBe('e2');
  });
});
