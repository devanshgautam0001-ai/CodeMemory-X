import * as vscode from 'vscode';
import { Result, ok, fail } from '@codememory/shared';
import {
  WorkspaceEvent,
  WorkspaceEventListener,
  WorkspaceEventType,
  WorkspaceSession,
  WorkspaceSnapshot,
} from '../types/WorkspaceEvent.js';
import { IWorkspaceWatcher } from '../ports/IWorkspaceWatcher.js';
import { ILogger } from '@codememory/logging';

export class VSCodeWorkspaceWatcher implements IWorkspaceWatcher {
  private listeners: Set<WorkspaceEventListener> = new Set();
  private disposables: vscode.Disposable[] = [];
  private isWatching = false;
  private currentSession?: WorkspaceSession;

  constructor(private readonly logger?: ILogger) {}

  public async startWatching(): Promise<Result<void>> {
    if (this.isWatching) {
      return ok(undefined);
    }

    try {
      this.logger?.info('Starting native VS Code workspace watcher subscriptions...');

      const workspacePath = this.getPrimaryWorkspacePath();
      this.currentSession = {
        sessionId: `session_${Date.now()}`,
        startTime: new Date().toISOString(),
        workspacePath,
        activeFile: vscode.window.activeTextEditor?.document.uri.fsPath,
      };

      // Emit WORKSPACE_OPEN event
      this.emitEvent('WORKSPACE_OPEN', workspacePath, '', {
        sessionId: this.currentSession.sessionId,
      });

      // 1. Text Document Open / Close / Modify
      this.disposables.push(
        vscode.workspace.onDidOpenTextDocument((doc) => {
          this.emitEvent('ACTIVE_FILE_CHANGED', workspacePath, doc.uri.fsPath, {
            languageId: doc.languageId,
          });
        })
      );

      this.disposables.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
          this.emitEvent('FILE_MODIFIED', workspacePath, e.document.uri.fsPath, {
            contentChangesCount: e.contentChanges.length,
            isDirty: e.document.isDirty,
          });
        })
      );

      this.disposables.push(
        vscode.workspace.onDidCloseTextDocument((doc) => {
          this.emitEvent('ACTIVE_FILE_CHANGED', workspacePath, doc.uri.fsPath, {
            action: 'closed',
          });
        })
      );

      // 2. Active Text Editor Switch
      this.disposables.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
          const activeFile = editor?.document.uri.fsPath || '';
          if (this.currentSession) {
            this.currentSession.activeFile = activeFile;
          }
          this.emitEvent('ACTIVE_EDITOR_CHANGED', workspacePath, activeFile, {
            viewColumn: editor?.viewColumn,
          });
        })
      );

      // 3. File System Watcher (Create, Delete, Rename)
      const fsWatcher = vscode.workspace.createFileSystemWatcher('**/*');
      this.disposables.push(fsWatcher);

      this.disposables.push(
        fsWatcher.onDidCreate((uri) => {
          this.emitEvent('FILE_CREATED', workspacePath, uri.fsPath, {});
        })
      );

      this.disposables.push(
        fsWatcher.onDidDelete((uri) => {
          this.emitEvent('FILE_DELETED', workspacePath, uri.fsPath, {});
        })
      );

      this.disposables.push(
        fsWatcher.onDidChange((uri) => {
          this.emitEvent('FILE_MODIFIED', workspacePath, uri.fsPath, { source: 'fsWatcher' });
        })
      );

      // 4. Workspace Folders Added / Removed
      this.disposables.push(
        vscode.workspace.onDidChangeWorkspaceFolders((event) => {
          event.added.forEach((folder) => {
            this.emitEvent('WORKSPACE_FOLDER_ADDED', workspacePath, folder.uri.fsPath, {
              folderName: folder.name,
            });
          });

          event.removed.forEach((folder) => {
            this.emitEvent('WORKSPACE_FOLDER_REMOVED', workspacePath, folder.uri.fsPath, {
              folderName: folder.name,
            });
          });
        })
      );

      this.isWatching = true;
      this.logger?.info('VS Code workspace watcher active.');
      return ok(undefined);
    } catch (error) {
      this.logger?.error('Failed to start workspace watcher', error as Error);
      return fail(error as Error);
    }
  }

  public async stopWatching(): Promise<Result<void>> {
    if (!this.isWatching) {
      return ok(undefined);
    }

    try {
      const workspacePath = this.getPrimaryWorkspacePath();
      if (this.currentSession) {
        this.currentSession.endTime = new Date().toISOString();
      }

      this.emitEvent('WORKSPACE_CLOSE', workspacePath, '', {
        sessionId: this.currentSession?.sessionId,
      });

      this.disposables.forEach((d) => d.dispose());
      this.disposables = [];
      this.isWatching = false;

      this.logger?.info('Stopped VS Code workspace watcher.');
      return ok(undefined);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public onEvent(listener: WorkspaceEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): Result<WorkspaceSnapshot> {
    const workspacePath = this.getPrimaryWorkspacePath();
    const openFiles = vscode.workspace.textDocuments.map((doc) => doc.uri.fsPath);
    const activeFile = vscode.window.activeTextEditor?.document.uri.fsPath;
    const totalFolders = vscode.workspace.workspaceFolders?.length || 0;

    return ok({
      workspacePath,
      openFiles,
      activeFile,
      totalFolders,
    });
  }

  public getCurrentSession(): Result<WorkspaceSession> {
    if (!this.currentSession) {
      return fail(new Error('No active workspace session'));
    }
    return ok(this.currentSession);
  }

  private emitEvent(
    eventType: WorkspaceEventType,
    workspace: string,
    file: string,
    metadata: Record<string, unknown>
  ): void {
    const event: WorkspaceEvent = {
      timestamp: new Date().toISOString(),
      workspace,
      file,
      eventType,
      metadata,
    };

    this.logger?.info(`[WorkspaceEvent] ${eventType}`, { file, metadata });

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        this.logger?.error('Error in workspace event listener', err as Error);
      }
    });
  }

  private getPrimaryWorkspacePath(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
  }
}
