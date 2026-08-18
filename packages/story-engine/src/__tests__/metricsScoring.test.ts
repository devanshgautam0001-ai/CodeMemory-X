import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('SymbolStoryEngine (Metrics)', () => {
  const engine = new SymbolStoryEngine();

  it('calculates deterministic cognitive metrics for built symbol story', async () => {
    const story = await engine.rebuild('s1', 'AuthService', 'src/auth.ts');
    expect(story.metrics.complexityScore).toBe(0.25);
    expect(story.metrics.confidenceScore).toBe(0.95);
  });
});
