import { describe, it, expect } from 'vitest';
import { StoryRepository } from '../repository/StoryRepository.js';

describe('StoryRepository (Incremental Invalidation)', () => {
  const repo = new StoryRepository();

  it('selectively invalidates cached story by symbol ID or file path', () => {
    const dummyStory: any = {
      symbolId: 'sym_1',
      name: 'AuthService',
      filePath: 'src/auth.ts',
    };

    repo.save(dummyStory);
    expect(repo.getBySymbolId('sym_1')).toBeDefined();

    repo.invalidateByFilePath('src/auth.ts');
    expect(repo.getBySymbolId('sym_1')).toBeUndefined();
  });
});
