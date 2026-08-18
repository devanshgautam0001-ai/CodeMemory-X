import { describe, it, expect } from 'vitest';
import { SymbolStoryEngine } from '../engine/SymbolStoryEngine.js';

describe('Selective Invalidation Matrix (CHANGE_IMPACT_ANALYZED)', () => {
  it('selectively invalidates affected story while leaving unrelated story cached', async () => {
    const engine = new SymbolStoryEngine();

    await engine.getStory('sym_1', 'AuthService', 'src/auth.ts');
    await engine.getStory('sym_2', 'UserRepo', 'src/user.ts');

    await engine.handleEvent({
      type: 'CHANGE_IMPACT_ANALYZED',
      payload: {
        rootId: 'src/auth.ts',
        affectedFiles: ['src/auth.ts'],
        affectedSymbols: ['sym_1'],
      },
    });

    const repo = (engine as any).repo;
    expect(repo.getBySymbolId('sym_1')).toBeUndefined();
    expect(repo.getBySymbolId('sym_2')).toBeDefined();
  });
});
