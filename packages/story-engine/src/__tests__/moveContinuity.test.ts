import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Symbol Identity Move Continuity', () => {
  it('preserves historical continuity when a symbol file is moved', async () => {
    const mockEventStore = {
      getEvents: async () => ({
        isSuccess: true,
        value: [
          { id: 'e1', type: 'FILE_OPEN', timestamp: '2026-08-09T08:00:00.000Z', payload: { filePath: 'src/legacy/adapter.ts' } },
          { id: 'e2', type: 'FILE_MOVED', timestamp: '2026-08-09T09:00:00.000Z', payload: { oldPath: 'src/legacy/adapter.ts', newPath: 'src/core/adapter.ts' } },
        ],
      }),
    } as any;

    const engine = new SymbolStoryEngine({ eventStore: mockEventStore });
    const story = await engine.rebuild('sym_adapter', 'Adapter', 'src/core/adapter.ts');

    expect(story.status).toBe('MOVED');
    expect(story.milestones.some((m) => m.type === 'MOVED')).toBe(true);
    expect(story.evidence.some((ev) => ev.description.includes('src/legacy/adapter.ts'))).toBe(true);
  });
});
