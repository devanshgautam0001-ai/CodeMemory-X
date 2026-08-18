import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Unrelated Same-Name Symbols Separation', () => {
  it('does NOT merge unrelated same-name symbols across different file paths', async () => {
    const engine = new SymbolStoryEngine();

    const storyA = await engine.rebuild('sym_pkgA_Config', 'Config', 'packages/pkgA/Config.ts');
    const storyB = await engine.rebuild('sym_pkgB_Config', 'Config', 'packages/pkgB/Config.ts');

    expect(storyA.symbolId).not.toBe(storyB.symbolId);
    expect(storyA.filePath).toBe('packages/pkgA/Config.ts');
    expect(storyB.filePath).toBe('packages/pkgB/Config.ts');
  });
});
