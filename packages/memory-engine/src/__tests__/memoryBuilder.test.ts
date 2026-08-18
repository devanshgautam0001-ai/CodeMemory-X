import { describe, it, expect } from 'vitest';
import { MemoryBuilder } from '../builder/MemoryBuilder.js';
import { EventRecord } from '@codememory/event-store';

describe('MemoryBuilder Event Interpretation', () => {
  it('should calculate confidence, importance, recency, and source event linkage', () => {
    const builder = new MemoryBuilder();
    const event: EventRecord = {
      id: 'evt_100',
      eventType: 'FILE_MODIFIED',
      timestamp: '2026-08-07T15:00:00Z',
      correlationId: 'c100',
      source: 'watcher',
      workspace: '/workspace',
      payload: { file: '/workspace/main.ts' },
      metadata: {},
    };

    const index = builder.buildFromEvents([event]);
    const fileMem = index.getByFile('/workspace/main.ts');

    expect(fileMem).toBeDefined();
    if (fileMem) {
      expect(fileMem.confidence).toBeGreaterThan(0);
      expect(fileMem.importance).toBeGreaterThan(0);
      expect(fileMem.recency).toBe('2026-08-07T15:00:00Z');
      expect(fileMem.sourceEvents).toContain('evt_100');
    }
  });
});
