import { simpleGit, SimpleGit, FileStatusResult } from 'simple-git';
import { Result, ok, fail } from '@codememory/shared';
import { IGitProvider } from '../ports/IGitProvider.js';
import { GitRepository } from '../models/GitRepository.js';
import { GitBranch } from '../models/GitBranch.js';
import { GitCommit } from '../models/GitCommit.js';
import { GitFileChange, GitChangeType } from '../models/GitFileChange.js';
import { GitHistory } from '../models/GitHistory.js';
import { ILogger } from '@codememory/logging';

export class SimpleGitAdapter implements IGitProvider {
  constructor(private readonly logger?: ILogger) {}

  private getInstance(path: string): SimpleGit {
    return simpleGit(path);
  }

  public async isRepository(path: string): Promise<Result<boolean>> {
    try {
      const git = this.getInstance(path);
      const check = await git.checkIsRepo();
      return ok(check);
    } catch (error) {
      this.logger?.error('Error checking if path is git repository', error as Error);
      return fail(error as Error);
    }
  }

  public async getRootPath(path: string): Promise<Result<string>> {
    try {
      const git = this.getInstance(path);
      const root = await git.revparse(['--show-toplevel']);
      return ok(root.trim());
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getRepository(path: string): Promise<Result<GitRepository>> {
    try {
      const rootRes = await this.getRootPath(path);
      if (rootRes.isFailure) return fail(rootRes.error);
      const rootPath = rootRes.value;

      const branchRes = await this.getCurrentBranch(rootPath);
      const headRes = await this.getHeadCommit(rootPath);

      return ok(
        new GitRepository({
          rootPath,
          isBare: false,
          currentBranchName: branchRes.isSuccess ? branchRes.value.name : undefined,
          headHash: headRes.isSuccess ? headRes.value.hash : undefined,
        })
      );
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getCurrentBranch(rootPath: string): Promise<Result<GitBranch>> {
    try {
      const git = this.getInstance(rootPath);
      const branchSummary = await git.branch();
      return ok(
        new GitBranch({
          name: branchSummary.current,
          isCurrent: true,
          commitHash: branchSummary.branches[branchSummary.current]?.commit || '',
        })
      );
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getHeadCommit(rootPath: string): Promise<Result<GitCommit>> {
    try {
      const recent = await this.getRecentCommits(rootPath, 1);
      if (recent.isFailure) return fail(recent.error);
      if (recent.value.length === 0) {
        return fail(new Error('No HEAD commit found in repository'));
      }
      return ok(recent.value[0]);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getRecentCommits(rootPath: string, limit = 10): Promise<Result<GitCommit[]>> {
    try {
      const git = this.getInstance(rootPath);
      const log = await git.log({ maxCount: limit });
      const commits = log.all.map(
        (c) =>
          new GitCommit({
            hash: c.hash,
            authorName: c.author_name,
            authorEmail: c.author_email,
            timestamp: c.date,
            message: c.message,
            parents: c.hash ? [] : [],
          })
      );
      return ok(commits);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getChangedFiles(rootPath: string): Promise<Result<GitFileChange[]>> {
    try {
      const git = this.getInstance(rootPath);
      const status = await git.status();
      const changes: GitFileChange[] = status.files.map((file: FileStatusResult) => {
        let changeType: GitChangeType = 'MODIFIED';
        if (file.index === 'A' || file.working_dir === 'A') changeType = 'ADDED';
        else if (file.index === 'D' || file.working_dir === 'D') changeType = 'DELETED';
        else if (file.index === 'R') changeType = 'RENAMED';
        else if (file.index === '?' || file.working_dir === '?') changeType = 'UNTRACKED';

        return new GitFileChange({
          filePath: file.path,
          changeType,
        });
      });
      return ok(changes);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async getFileHistory(
    rootPath: string,
    filePath: string,
    limit = 10
  ): Promise<Result<GitHistory>> {
    try {
      const git = this.getInstance(rootPath);
      const log = await git.log({ file: filePath, maxCount: limit });
      const commits = log.all.map(
        (c) =>
          new GitCommit({
            hash: c.hash,
            authorName: c.author_name,
            authorEmail: c.author_email,
            timestamp: c.date,
            message: c.message,
            parents: [],
          })
      );
      return ok(
        new GitHistory({
          filePath,
          commits,
          totalCommits: commits.length,
        })
      );
    } catch (error) {
      return fail(error as Error);
    }
  }
}
