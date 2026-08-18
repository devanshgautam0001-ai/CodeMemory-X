import { describe, it, expect, vi } from 'vitest';
import { ok } from '@codememory/shared';
import { GitService } from '../services/GitService.js';
import { IGitProvider } from '../ports/IGitProvider.js';
import { GitBranch } from '../models/GitBranch.js';
import { GitCommit } from '../models/GitCommit.js';
import { GitFileChange } from '../models/GitFileChange.js';
import { GitHistory } from '../models/GitHistory.js';
import { GitRepository } from '../models/GitRepository.js';

describe('GitService (Read-Only Foundation)', () => {
  const mockBranch = new GitBranch({
    name: 'main',
    isCurrent: true,
    commitHash: 'abc1234',
  });

  const mockCommit = new GitCommit({
    hash: 'abc1234',
    authorName: 'Developer',
    authorEmail: 'dev@company.com',
    timestamp: '2026-08-07T19:00:00Z',
    message: 'feat: add git engine',
    parents: ['def5678'],
  });

  const mockProvider: IGitProvider = {
    isRepository: vi.fn().mockResolvedValue(ok(true)),
    getRootPath: vi.fn().mockResolvedValue(ok('/workspace/project')),
    getRepository: vi.fn().mockResolvedValue(
      ok(
        new GitRepository({
          rootPath: '/workspace/project',
          isBare: false,
          currentBranchName: 'main',
          headHash: 'abc1234',
        })
      )
    ),
    getCurrentBranch: vi.fn().mockResolvedValue(ok(mockBranch)),
    getHeadCommit: vi.fn().mockResolvedValue(ok(mockCommit)),
    getRecentCommits: vi.fn().mockResolvedValue(ok([mockCommit])),
    getChangedFiles: vi.fn().mockResolvedValue(
      ok([new GitFileChange({ filePath: 'src/main.ts', changeType: 'MODIFIED' })])
    ),
    getFileHistory: vi.fn().mockResolvedValue(
      ok(new GitHistory({ filePath: 'src/main.ts', commits: [mockCommit], totalCommits: 1 }))
    ),
  };

  it('should detect git repository status', async () => {
    const service = new GitService(mockProvider);
    const res = await service.detectRepository('/workspace/project');
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value).toBe(true);
    }
  });

  it('should retrieve repository metadata', async () => {
    const service = new GitService(mockProvider);
    const res = await service.getRepositoryInfo('/workspace/project');
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.currentBranchName).toBe('main');
      expect(res.value.headHash).toBe('abc1234');
    }
  });

  it('should read active branch and head commit', async () => {
    const service = new GitService(mockProvider);
    const branchRes = await service.getCurrentBranch('/workspace/project');
    const commitRes = await service.getHeadCommit('/workspace/project');

    expect(branchRes.isSuccess && branchRes.value.name).toBe('main');
    expect(commitRes.isSuccess && commitRes.value.authorEmail).toBe('dev@company.com');
  });

  it('should retrieve changed files list in working tree', async () => {
    const service = new GitService(mockProvider);
    const res = await service.getChangedFiles('/workspace/project');
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value).toHaveLength(1);
      expect(res.value[0].changeType).toBe('MODIFIED');
    }
  });

  it('should retrieve file history', async () => {
    const service = new GitService(mockProvider);
    const res = await service.getFileHistory('/workspace/project', 'src/main.ts');
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.commits).toHaveLength(1);
      expect(res.value.totalCommits).toBe(1);
    }
  });
});
