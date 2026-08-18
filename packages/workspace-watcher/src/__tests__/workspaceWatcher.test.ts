import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VSCodeWorkspaceWatcher } from '../services/VSCodeWorkspaceWatcher.js';
import { WorkspaceEvent, WorkspaceEventType } from '../types/WorkspaceEvent.js';

const mockDisposables: { dispose: ReturnType<typeof vi.fn> }[] = [];
let openDocListener: (doc: any) => void;
let changeDocListener: (e: any) => void;
let closeDocListener: (doc: any) => void;
let activeEditorListener: (editor: any) => void;
let createFsListener: (uri: any) => void;
let deleteFsListener: (uri: any) => void;
let changeFsListener: (uri: any) => void;
let folderChangeListener: (event: any) => void;

vi.mock('vscode', () => {
  return {
    workspace: {
      workspaceFolders: [
        { uri: { fsPath: '/workspace/project' }, name: 'project' },
      ],
      textDocuments: [
        { uri: { fsPath: '/workspace/project/src/index.ts' }, languageId: 'typescript' },
      ],
      onDidOpenTextDocument: vi.fn().mockImplementation((cb) => {
        openDocListener = cb;
        const d = { dispose: vi.fn() };
        mockDisposables.push(d);
        return d;
      }),
      onDidChangeTextDocument: vi.fn().mockImplementation((cb) => {
        changeDocListener = cb;
        const d = { dispose: vi.fn() };
        mockDisposables.push(d);
        return d;
      }),
      onDidCloseTextDocument: vi.fn().mockImplementation((cb) => {
        closeDocListener = cb;
        const d = { dispose: vi.fn() };
        mockDisposables.push(d);
        return d;
      }),
      createFileSystemWatcher: vi.fn().mockReturnValue({
        onDidCreate: vi.fn().mockImplementation((cb) => {
          createFsListener = cb;
          return { dispose: vi.fn() };
        }),
        onDidDelete: vi.fn().mockImplementation((cb) => {
          deleteFsListener = cb;
          return { dispose: vi.fn() };
        }),
        onDidChange: vi.fn().mockImplementation((cb) => {
          changeFsListener = cb;
          return { dispose: vi.fn() };
        }),
        dispose: vi.fn(),
      }),
      onDidChangeWorkspaceFolders: vi.fn().mockImplementation((cb) => {
        folderChangeListener = cb;
        const d = { dispose: vi.fn() };
        mockDisposables.push(d);
        return d;
      }),
    },
    window: {
      activeTextEditor: {
        document: { uri: { fsPath: '/workspace/project/src/index.ts' } },
        viewColumn: 1,
      },
      onDidChangeActiveTextEditor: vi.fn().mockImplementation((cb) => {
        activeEditorListener = cb;
        const d = { dispose: vi.fn() };
        mockDisposables.push(d);
        return d;
      }),
    },
  };
});

describe('VSCodeWorkspaceWatcher (Native Observation)', () => {
  let watcher: VSCodeWorkspaceWatcher;
  const capturedEvents: WorkspaceEvent[] = [];

  beforeEach(() => {
    capturedEvents.length = 0;
    watcher = new VSCodeWorkspaceWatcher();
    watcher.onEvent((evt: WorkspaceEvent) => {
      capturedEvents.push(evt);
    });
  });

  it('should emit WORKSPACE_OPEN on startWatching', async () => {
    const res = await watcher.startWatching();
    expect(res.isSuccess).toBe(true);
    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0].eventType).toBe('WORKSPACE_OPEN');
    expect(capturedEvents[0].workspace).toBe('/workspace/project');
  });

  it('should emit WORKSPACE_CLOSE on stopWatching', async () => {
    await watcher.startWatching();
    capturedEvents.length = 0;

    const res = await watcher.stopWatching();
    expect(res.isSuccess).toBe(true);
    expect(capturedEvents[0].eventType).toBe('WORKSPACE_CLOSE');
  });

  it('should emit ACTIVE_FILE_CHANGED and FILE_MODIFIED events', async () => {
    await watcher.startWatching();
    capturedEvents.length = 0;

    // Simulate document open
    openDocListener({ uri: { fsPath: '/workspace/project/src/auth.ts' }, languageId: 'typescript' });
    expect(capturedEvents[0].eventType).toBe('ACTIVE_FILE_CHANGED');
    expect(capturedEvents[0].file).toBe('/workspace/project/src/auth.ts');

    // Simulate document edit
    changeDocListener({
      document: { uri: { fsPath: '/workspace/project/src/auth.ts' }, isDirty: true },
      contentChanges: [{ text: 'const a = 1;' }],
    });
    expect(capturedEvents[1].eventType).toBe('FILE_MODIFIED');
  });

  it('should emit ACTIVE_EDITOR_CHANGED on tab focus switch', async () => {
    await watcher.startWatching();
    capturedEvents.length = 0;

    activeEditorListener({
      document: { uri: { fsPath: '/workspace/project/src/app.ts' } },
      viewColumn: 2,
    });

    expect(capturedEvents[0].eventType).toBe('ACTIVE_EDITOR_CHANGED');
    expect(capturedEvents[0].file).toBe('/workspace/project/src/app.ts');
  });

  it('should emit FILE_CREATED, FILE_DELETED from FS watcher', async () => {
    await watcher.startWatching();
    capturedEvents.length = 0;

    createFsListener({ fsPath: '/workspace/project/src/newFile.ts' });
    deleteFsListener({ fsPath: '/workspace/project/src/oldFile.ts' });

    expect(capturedEvents[0].eventType).toBe('FILE_CREATED');
    expect(capturedEvents[0].file).toBe('/workspace/project/src/newFile.ts');

    expect(capturedEvents[1].eventType).toBe('FILE_DELETED');
    expect(capturedEvents[1].file).toBe('/workspace/project/src/oldFile.ts');
  });

  it('should emit WORKSPACE_FOLDER_ADDED and WORKSPACE_FOLDER_REMOVED', async () => {
    await watcher.startWatching();
    capturedEvents.length = 0;

    folderChangeListener({
      added: [{ uri: { fsPath: '/workspace/sub-package' }, name: 'sub-package' }],
      removed: [{ uri: { fsPath: '/workspace/old-package' }, name: 'old-package' }],
    });

    expect(capturedEvents[0].eventType).toBe('WORKSPACE_FOLDER_ADDED');
    expect(capturedEvents[1].eventType).toBe('WORKSPACE_FOLDER_REMOVED');
  });

  it('should provide workspace snapshot and session info', async () => {
    await watcher.startWatching();
    const snapshotRes = watcher.getSnapshot();
    const sessionRes = watcher.getCurrentSession();

    expect(snapshotRes.isSuccess).toBe(true);
    expect(sessionRes.isSuccess).toBe(true);

    if (snapshotRes.isSuccess) {
      expect(snapshotRes.value.workspacePath).toBe('/workspace/project');
      expect(snapshotRes.value.totalFolders).toBe(1);
    }
  });
});
