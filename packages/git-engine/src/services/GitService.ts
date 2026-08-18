import { Result } from '@codememory/shared';
import { IGitProvider } from '../ports/IGitProvider.js';
import { GitRepository } from '../models/GitRepository.js';
import { GitBranch } from '../models/GitBranch.js';
import { GitCommit } from '../models/GitCommit.js';
import { GitFileChange } from '../models/GitFileChange.js';
import { GitHistory } from '../models/GitHistory.js';
import { ILogger } from '@codememory/logging';

export class GitService {
  constructor(
    private readonly provider: IGitProvider,
    private readonly logger?: ILogger
  ) {}

  public async detectRepository(workspacePath: string): Promise<Result<boolean>> {
    this.logger?.info('Detecting Git repository at path', { workspacePath });
    return this.provider.isRepository(workspacePath);
  }

  public async getRepositoryInfo(workspacePath: string): Promise<Result<GitRepository>> {
    return this.provider.getRepository(workspacePath);
  }

  public async getCurrentBranch(rootPath: string): Promise<Result<GitBranch>> {
    return this.provider.getCurrentBranch(rootPath);
  }

  public async getHeadCommit(rootPath: string): Promise<Result<GitCommit>> {
    return this.provider.getHeadCommit(rootPath);
  }

  public async getRecentCommits(rootPath: string, limit?: number): Promise<Result<GitCommit[]>> {
    return this.provider.getRecentCommits(rootPath, limit);
  }

  public async getChangedFiles(rootPath: string): Promise<Result<GitFileChange[]>> {
    return this.provider.getChangedFiles(rootPath);
  }

  public async getFileHistory(
    rootPath: string,
    filePath: string,
    limit?: number
  ): Promise<Result<GitHistory>> {
    return this.provider.getFileHistory(rootPath, filePath, limit);
  }
}
