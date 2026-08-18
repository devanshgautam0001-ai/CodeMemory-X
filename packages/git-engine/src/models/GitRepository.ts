import { ValueObject } from '@codememory/core';

export interface GitRepositoryProps {
  rootPath: string;
  isBare: boolean;
  currentBranchName?: string;
  headHash?: string;
}

export class GitRepository extends ValueObject<GitRepositoryProps> {
  get rootPath(): string {
    return this.props.rootPath;
  }

  get isBare(): boolean {
    return this.props.isBare;
  }

  get currentBranchName(): string | undefined {
    return this.props.currentBranchName;
  }

  get headHash(): string | undefined {
    return this.props.headHash;
  }
}
