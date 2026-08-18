import { AIContext } from '../types/AIContext.js';

export interface ContextSnapshotProps {
  id: string;
  timestamp: string;
  context: AIContext;
}

export class ContextSnapshot {
  constructor(public readonly props: ContextSnapshotProps) {}

  get id(): string {
    return this.props.id;
  }

  get timestamp(): string {
    return this.props.timestamp;
  }

  get context(): AIContext {
    return this.props.context;
  }
}
