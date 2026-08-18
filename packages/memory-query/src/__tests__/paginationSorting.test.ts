import { describe, it, expect } from 'vitest';
import { MemoryRepository } from '@codememory/memory-engine';
import { EventRecord } from '@codememory/event-store';
import { MemoryQueryEngine } from '../engine/MemoryQueryEngine.js';

describe('MemoryQueryEngine Pagination & Sorting', () => {
  it('should paginate and sort query results correctly', () => {
    const repository = new MemoryRepository();
    const events: EventRecord[] = Array.from({ length: 15 }, (_, i) => ({
      id: `evt_${i}`,
      eventType: 'FILE_MODIFIED',
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
      correlationId: `c_${i}`,
      source: 'watcher',
      workspace: '/workspace',
      payload: { file: `/workspace/file_${i}.ts` },
      metadata: {},
    }));

    repository.buildMemory(events);
    const queryEngine = new MemoryQueryEngine(repository);

    const page1 = queryEngine.search({ page: 1, pageSize: 5, sortBy: 'recency', sortOrder: 'desc' });
    expect(page1.items).toHaveLength(5);
    expect(page1.totalMatches).toBe(15);
    expect(page1.totalPages).toBe(3);

    const page2 = queryEngine.search({ page: 2, pageSize: 5, sortBy: 'recency', sortOrder: 'desc' });
    expect(page2.items).toHaveLength(5);
    expect(page2.page).toBe(2);
  });
});
