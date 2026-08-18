export type WorkspaceEventType =
  | 'WORKSPACE_OPEN'
  | 'WORKSPACE_CLOSE'
  | 'FILE_CREATED'
  | 'FILE_DELETED'
  | 'FILE_MODIFIED'
  | 'FILE_RENAMED'
  | 'ACTIVE_EDITOR_CHANGED'
  | 'ACTIVE_FILE_CHANGED'
  | 'WORKSPACE_FOLDER_ADDED'
  | 'WORKSPACE_FOLDER_REMOVED';

export interface WorkspaceEvent {
  timestamp: string;
  workspace: string;
  file: string;
  eventType: WorkspaceEventType;
  metadata: Record<string, unknown>;
}

export type WorkspaceEventListener = (event: WorkspaceEvent) => void | Promise<void>;

export interface WorkspaceSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  workspacePath: string;
  activeFile?: string;
}

export interface WorkspaceSnapshot {
  workspacePath: string;
  openFiles: string[];
  activeFile?: string;
  totalFolders: number;
}
