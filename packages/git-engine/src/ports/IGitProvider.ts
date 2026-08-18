import { Result } from '@codememory/shared';
import { GitRepository } from '../models/GitRepository.js';
import { GitBranch } from '../models/GitBranch.js';
import { GitCommit } from '../models/GitCommit.js';
import { GitFileChange } from '../models/GitFileChange.js';
import { GitHistory } from '../models/GitHistory.js';

export interface IGitProvider {
  isRepository(path: string): Promise<Result<boolean>>;
  getRootPath(path: string): Promise<Result<string>>;
  getRepository(path: string): Promise<Result<GitRepository>>;
  getCurrentBranch(rootPath: string): Promise<Result<GitBranch>>;
  getHeadCommit(rootPath: string): Promise<Result<GitCommit>>;
  getRecentCommits(rootPath: string, limit?: number): Promise<Result<GitCommit[]>>;
  getChangedFiles(rootPath: string): Promise<Result<GitFileChange[]>>;
  getFileHistory(rootPath: string, filePath: string, limit?: number): Promise<Result<GitHistory>>;
}
