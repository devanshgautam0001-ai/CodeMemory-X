import { ValueObject } from '@codememory/core';
import { GitCommit } from './GitCommit.js';

export interface GitHistoryProps {
  filePath?: string;
  commits: GitCommit[];
  totalCommits: number;
}

export class GitHistory extends ValueObject<GitHistoryProps> {
  get filePath(): string | undefined {
    return this.props.filePath;
  }

  get commits(): GitCommit[] {
    return this.props.commits;
  }

  get totalCommits(): number {
    return this.props.totalCommits;
  }
}
