import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('SymbolStoryEngine (Confidence & Evidence)', () => {
  const engine = new SymbolStoryEngine();

  it('attaches evidence and deterministic confidence to SymbolStory', async () => {
    const story = await engine.rebuild('s1', 'UserRepo', 'src/user.ts');
    expect(story.confidence).toBeGreaterThan(0.80);
    expect(story.evidence.length).toBeGreaterThan(0);
    expect(story.evidence[0].certainty).toBe('OBSERVED');
  });
});
