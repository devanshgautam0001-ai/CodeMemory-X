import { describe, it, expect, vi } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Event Bus Contract (SYMBOL_STORY_MILESTONE_ADDED)', () => {
  it('emits SYMBOL_STORY_MILESTONE_ADDED when a milestone is added', async () => {
    const publishedEvents: any[] = [];
    const mockBus = {
      publish: vi.fn((evt) => publishedEvents.push(evt)),
    } as any;

    const mockEventStore = {
      getEvents: async () => ({
        isSuccess: true,
        value: [
          { id: 'evt_m1', type: 'FILE_OPEN', timestamp: '2026-08-09T10:00:00.000Z', payload: { filePath: 'src/app.ts' } },
        ],
      }),
    } as any;

    const engine = new SymbolStoryEngine({ eventBus: mockBus, eventStore: mockEventStore });
    await engine.rebuild('sym_1', 'App', 'src/app.ts');

    expect(publishedEvents.some((e) => e.type === 'SYMBOL_STORY_MILESTONE_ADDED')).toBe(true);
  });
});
