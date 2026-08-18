import { describe, it, expect } from 'vitest';
import { MemoryRepository } from '@codememory/memory-engine';
import { EventRecord } from '@codememory/event-store';
import { MemoryQueryEngine } from '../engine/MemoryQueryEngine.js';

describe('MemoryQueryEngine Convenience APIs', () => {
  it('should find recent, important, and related memories via convenience methods', () => {
    const repository = new MemoryRepository();
    const events: EventRecord[] = [
      {
        id: 'e1',
        eventType: 'RECORD_DECISION',
        timestamp: '2026-08-07T12:00:00Z',
        correlationId: 'c1',
        source: 'vscode',
        workspace: '/workspace',
        payload: { title: 'High Priority ADR', boundSymbols: ['AuthService'] },
        metadata: {},
      },
      {
        id: 'e2',
        eventType: 'FILE_MODIFIED',
        timestamp: '2026-08-07T12:10:00Z',
        correlationId: 'c1',
        source: 'watcher',
        workspace: '/workspace',
        payload: { file: '/workspace/src/AuthService.ts' },
        metadata: {},
      },
    ];

    repository.buildMemory(events);
    const queryEngine = new MemoryQueryEngine(repository);

    const important = queryEngine.findImportant(0.9);
    expect(important.length).toBeGreaterThanOrEqual(1);

    const recent = queryEngine.findRecent(2);
    expect(recent.length).toBeGreaterThanOrEqual(1);

    const fileMem = queryEngine.findByFile('/workspace/src/AuthService.ts');
    expect(fileMem).toBeDefined();

    // Stream search iterator
    const streamed: any[] = [];
    for (const mem of queryEngine.streamSearch({})) {
      streamed.push(mem);
    }
    expect(streamed.length).toBeGreaterThanOrEqual(2);
  });
});
