import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EventStore } from '@codememory/event-store';
import { MemoryEngine } from '../engine/MemoryEngine.js';

describe('MemoryEngine Rebuild & Determinism', () => {
  let eventStore: EventStore;

  beforeEach(async () => {
    eventStore = new EventStore();
    await eventStore.initialize();
  });

  afterEach(() => {
    eventStore.close();
  });

  it('should rebuild memory state from zero events deterministically', async () => {
    await eventStore.appendEvent({
      id: 'e1',
      eventType: 'WORKSPACE_OPEN',
      timestamp: '2026-08-07T10:00:00Z',
      correlationId: 'c1',
      source: 'watcher',
      workspace: '/workspace/project',
      payload: {},
      metadata: { sessionId: 'sess-1' },
    });

    await eventStore.appendEvent({
      id: 'e2',
      eventType: 'FILE_MODIFIED',
      timestamp: '2026-08-07T10:01:00Z',
      correlationId: 'c1',
      source: 'watcher',
      workspace: '/workspace/project',
      payload: { file: '/workspace/project/src/auth.ts' },
      metadata: {},
    });

    await eventStore.appendEvent({
      id: 'e3',
      eventType: 'RECORD_DECISION',
      timestamp: '2026-08-07T10:02:00Z',
      correlationId: 'c1',
      source: 'vscode',
      workspace: '/workspace/project',
      payload: { title: 'Use JWT Auth', rationale: 'Stateless scale', boundSymbols: ['AuthService'] },
      metadata: {},
    });

    const engine = new MemoryEngine(eventStore);
    const rebuild1 = await engine.rebuild();
    expect(rebuild1.isSuccess).toBe(true);

    if (rebuild1.isSuccess) {
      expect(rebuild1.value.memories).toHaveLength(3); // session, file, decision
    }

    // Rebuild again to verify deterministic memory output
    const rebuild2 = await engine.rebuild();
    expect(rebuild2.isSuccess).toBe(true);

    if (rebuild1.isSuccess && rebuild2.isSuccess) {
      expect(rebuild1.value.memories.map((m) => m.id)).toEqual(rebuild2.value.memories.map((m) => m.id));
    }
  });
});
