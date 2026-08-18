import { ValueObject } from '@codememory/core';

export interface GitCommitProps {
  hash: string;
  authorName: string;
  authorEmail: string;
  timestamp: string;
  message: string;
  parents: string[];
}

export class GitCommit extends ValueObject<GitCommitProps> {
  get hash(): string {
    return this.props.hash;
  }

  get authorName(): string {
    return this.props.authorName;
  }

  get authorEmail(): string {
    return this.props.authorEmail;
  }

  get timestamp(): string {
    return this.props.timestamp;
  }

  get message(): string {
    return this.props.message;
  }

  get parents(): string[] {
    return this.props.parents;
  }
}
