import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Symbol Identity Rename Continuity', () => {
  it('connects renamed symbol to its historical story and old name evidence', async () => {
    const mockEventStore = {
      getEvents: async () => ({
        isSuccess: true,
        value: [
          { id: 'e1', type: 'FILE_OPEN', timestamp: '2026-08-09T08:00:00.000Z', payload: { filePath: 'src/service.ts', symbolName: 'OldService' } },
          { id: 'e2', type: 'SYMBOL_RENAMED', timestamp: '2026-08-09T09:00:00.000Z', payload: { filePath: 'src/service.ts', oldName: 'OldService', newName: 'NewService' } },
        ],
      }),
    } as any;

    const engine = new SymbolStoryEngine({ eventStore: mockEventStore });
    const story = await engine.rebuild('sym_NewService', 'NewService', 'src/service.ts');

    expect(story.status).toBe('RENAMED');
    expect(story.milestones.some((m) => m.type === 'RENAMED')).toBe(true);
    expect(story.evidence.some((ev) => ev.description.includes('OldService'))).toBe(true);
  });
});
