import { describe, it, expect, vi } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Event Bus Contract (SYMBOL_STORY_RISK_CHANGED)', () => {
  it('emits SYMBOL_STORY_RISK_CHANGED when risk score changes', async () => {
    const publishedEvents: any[] = [];
    const mockBus = {
      publish: vi.fn((evt) => publishedEvents.push(evt)),
    } as any;

    const mockDrift = {
      getFindingsForFile: vi.fn().mockReturnValue([
        { id: 'f1', score: 0.90, title: 'Boundary Violation' },
      ]),
    } as any;

    const engine = new SymbolStoryEngine({ eventBus: mockBus, driftSentinel: mockDrift });
    await engine.rebuild('sym_1', 'Core', 'src/core.ts');

    expect(publishedEvents.some((e) => e.type === 'SYMBOL_STORY_RISK_CHANGED')).toBe(true);
  });
});
