import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRepository } from '@codememory/memory-engine';
import { EventRecord } from '@codememory/event-store';
import { MemoryQueryEngine } from '../engine/MemoryQueryEngine.js';

describe('MemoryQueryEngine Filters & Query Options', () => {
  let repository: MemoryRepository;
  let queryEngine: MemoryQueryEngine;

  beforeEach(() => {
    repository = new MemoryRepository();
    const events: EventRecord[] = [
      {
        id: 'e1',
        eventType: 'FILE_MODIFIED',
        timestamp: '2026-08-07T10:00:00Z',
        correlationId: 'c1',
        source: 'watcher',
        workspace: '/workspace/project',
        payload: { file: '/workspace/project/src/auth.ts' },
        metadata: {},
      },
      {
        id: 'e2',
        eventType: 'RECORD_DECISION',
        timestamp: '2026-08-07T11:00:00Z',
        correlationId: 'c1',
        source: 'vscode',
        workspace: '/workspace/project',
        payload: { title: 'Use OAuth2 Token Validation', boundSymbols: ['AuthService'] },
        metadata: {},
      },
    ];
    repository.buildMemory(events);
    queryEngine = new MemoryQueryEngine(repository);
  });

  it('should filter memories by type', () => {
    const fileResult = queryEngine.search({ types: ['file'] });
    expect(fileResult.totalMatches).toBe(1);
    expect(fileResult.items[0].memory.type).toBe('file');

    const decResult = queryEngine.search({ types: ['decision'] });
    expect(decResult.totalMatches).toBe(1);
    expect(decResult.items[0].memory.type).toBe('decision');
  });

  it('should filter memories by search text query', () => {
    const res = queryEngine.search({ query: 'OAuth2' });
    expect(res.totalMatches).toBe(1);
    expect((res.items[0].memory as any).decisionTitle).toContain('OAuth2');
  });
});
