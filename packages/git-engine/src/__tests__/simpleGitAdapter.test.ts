import { describe, it, expect, vi } from 'vitest';
import { SimpleGitAdapter } from '../adapters/SimpleGitAdapter.js';

vi.mock('simple-git', () => {
  return {
    simpleGit: vi.fn().mockReturnValue({
      checkIsRepo: vi.fn().mockResolvedValue(true),
      revparse: vi.fn().mockResolvedValue('/mock/repo/root\n'),
      branch: vi.fn().mockResolvedValue({
        current: 'feature/auth-refactor',
        branches: {
          'feature/auth-refactor': { commit: '123456789' },
        },
      }),
      log: vi.fn().mockResolvedValue({
        all: [
          {
            hash: '123456789',
            author_name: 'Lead Architect',
            author_email: 'architect@company.com',
            date: '2026-08-07T19:15:32Z',
            message: 'feat(auth): refactor token validation',
          },
        ],
      }),
      status: vi.fn().mockResolvedValue({
        files: [{ path: 'src/auth.ts', index: 'M', working_dir: 'M' }],
      }),
    }),
  };
});

describe('SimpleGitAdapter Unit Tests', () => {
  it('should detect repository status using simple-git', async () => {
    const adapter = new SimpleGitAdapter();
    const isRepo = await adapter.isRepository('/mock/repo');
    expect(isRepo.isSuccess && isRepo.value).toBe(true);
  });

  it('should parse root path cleanly', async () => {
    const adapter = new SimpleGitAdapter();
    const root = await adapter.getRootPath('/mock/repo');
    expect(root.isSuccess && root.value).toBe('/mock/repo/root');
  });

  it('should parse current branch and head commit', async () => {
    const adapter = new SimpleGitAdapter();
    const branch = await adapter.getCurrentBranch('/mock/repo');
    const commit = await adapter.getHeadCommit('/mock/repo');

    expect(branch.isSuccess && branch.value.name).toBe('feature/auth-refactor');
    expect(commit.isSuccess && commit.value.hash).toBe('123456789');
  });

  it('should parse changed files list', async () => {
    const adapter = new SimpleGitAdapter();
    const changes = await adapter.getChangedFiles('/mock/repo');
    expect(changes.isSuccess && changes.value).toHaveLength(1);
  });

  it('should parse file history', async () => {
    const adapter = new SimpleGitAdapter();
    const history = await adapter.getFileHistory('/mock/repo', 'src/auth.ts');
    expect(history.isSuccess && history.value.commits).toHaveLength(1);
  });
});
