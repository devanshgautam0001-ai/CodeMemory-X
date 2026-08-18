import { ValueObject } from '@codememory/core';

export interface GitBranchProps {
  name: string;
  isCurrent: boolean;
  commitHash: string;
}

export class GitBranch extends ValueObject<GitBranchProps> {
  get name(): string {
    return this.props.name;
  }

  get isCurrent(): boolean {
    return this.props.isCurrent;
  }

  get commitHash(): string {
    return this.props.commitHash;
  }
}
