import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('SymbolStoryEngine (Deterministic Execution)', () => {
  it('produces identical SymbolStory output for identical inputs', async () => {
    const engine1 = new SymbolStoryEngine();
    const engine2 = new SymbolStoryEngine();

    const story1 = await engine1.rebuild('s1', 'CoreService', 'src/core.ts');
    const story2 = await engine2.rebuild('s1', 'CoreService', 'src/core.ts');

    expect(story1.name).toBe(story2.name);
    expect(story1.status).toBe(story2.status);
    expect(story1.milestones.length).toBe(story2.milestones.length);
    expect(story1.confidence).toBe(story2.confidence);
  });
});
