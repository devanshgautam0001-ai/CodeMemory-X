import { Result } from '@codememory/shared';
import {
  WorkspaceEvent,
  WorkspaceEventListener,
  WorkspaceSession,
  WorkspaceSnapshot,
} from '../types/WorkspaceEvent.js';

export interface IWorkspaceWatcher {
  startWatching(): Promise<Result<void>>;
  stopWatching(): Promise<Result<void>>;
  onEvent(listener: WorkspaceEventListener): () => void;
  getSnapshot(): Result<WorkspaceSnapshot>;
  getCurrentSession(): Result<WorkspaceSession>;
}
