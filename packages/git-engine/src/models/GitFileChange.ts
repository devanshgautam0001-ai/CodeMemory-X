import { ValueObject } from '@codememory/core';

export type GitChangeType = 'ADDED' | 'MODIFIED' | 'DELETED' | 'RENAMED' | 'UNTRACKED';

export interface GitFileChangeProps {
  filePath: string;
  changeType: GitChangeType;
  oldFilePath?: string;
}

export class GitFileChange extends ValueObject<GitFileChangeProps> {
  get filePath(): string {
    return this.props.filePath;
  }

  get changeType(): GitChangeType {
    return this.props.changeType;
  }

  get oldFilePath(): string | undefined {
    return this.props.oldFilePath;
  }
}
