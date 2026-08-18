import { describe, it, expect, vi } from 'vitest';
import { MemoryContextProvider } from '../context/MemoryContextProvider.js';
import { MemoryQueryEngine } from '@codememory/memory-query';

describe('MemoryContextProvider Unit Tests', () => {
  it('retrieves relevant developer memories from query engine', async () => {
    const mockQuery = {
      search: vi.fn().mockReturnValue({ items: [{ id: 'm1', summary: 'Found' }] }),
    } as unknown as MemoryQueryEngine;

    const provider = new MemoryContextProvider(mockQuery);
    const res = await provider.getMemories({ requestId: 'r1', prompt: 'test query' });

    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('m1');
  });

  it('handles missing query engine or throwing search gracefully', async () => {
    const providerEmpty = new MemoryContextProvider(undefined);
    expect(await providerEmpty.getMemories({ requestId: 'r2', prompt: 'q' })).toEqual([]);

    const mockThrowing = {
      search: vi.fn().mockImplementation(() => { throw new Error('Search failed'); }),
    } as unknown as MemoryQueryEngine;
    const providerThrowing = new MemoryContextProvider(mockThrowing);
    expect(await providerThrowing.getMemories({ requestId: 'r3', prompt: 'q' })).toEqual([]);
  });
});
