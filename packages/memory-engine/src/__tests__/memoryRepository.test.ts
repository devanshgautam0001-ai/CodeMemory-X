import { describe, it, expect } from 'vitest';
import { MemoryRepository } from '../repository/MemoryRepository.js';
import { EventRecord } from '@codememory/event-store';

describe('MemoryRepository Query APIs', () => {
  const events: EventRecord[] = [
    {
      id: 'e1',
      eventType: 'WORKSPACE_OPEN',
      timestamp: '2026-08-07T12:00:00Z',
      correlationId: 'c1',
      source: 'watcher',
      workspace: '/workspace/project',
      payload: {},
      metadata: { sessionId: 'sess-abc' },
    },
    {
      id: 'e2',
      eventType: 'FILE_MODIFIED',
      timestamp: '2026-08-07T12:01:00Z',
      correlationId: 'c1',
      source: 'watcher',
      workspace: '/workspace/project',
      payload: { file: '/workspace/project/src/index.ts' },
      metadata: {},
    },
    {
      id: 'e3',
      eventType: 'RECORD_DECISION',
      timestamp: '2026-08-07T12:02:00Z',
      correlationId: 'c1',
      source: 'vscode',
      workspace: '/workspace/project',
      payload: { title: 'Adopt Hexagonal Architecture', rationale: 'Clean boundaries', boundSymbols: ['AppModule'] },
      metadata: {},
    },
  ];

  it('should build and query memories by file, session, and search', () => {
    const repo = new MemoryRepository();
    repo.buildMemory(events);

    const fileMem = repo.getFileMemory('/workspace/project/src/index.ts');
    expect(fileMem).toBeDefined();
    expect(fileMem?.editCount).toBe(1);

    const sessMem = repo.getSessionMemory('sess-abc');
    expect(sessMem).toBeDefined();

    const searchResults = repo.searchMemory('Hexagonal');
    expect(searchResults).toHaveLength(1);
    expect((searchResults[0] as any).decisionTitle).toBe('Adopt Hexagonal Architecture');
  });
});
