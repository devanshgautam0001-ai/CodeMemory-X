import { MemoryModel } from '../types/MemoryTypes.js';

export interface MemorySnapshotProps {
  version: number;
  createdAt: string;
  memories: MemoryModel[];
  totalEventsProcessed: number;
}

export class MemorySnapshot {
  constructor(public readonly props: MemorySnapshotProps) {}

  get version(): number {
    return this.props.version;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  get memories(): MemoryModel[] {
    return this.props.memories;
  }

  get totalEventsProcessed(): number {
    return this.props.totalEventsProcessed;
  }
}
