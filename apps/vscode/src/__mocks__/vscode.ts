import { vi } from 'vitest';

export const Uri = {
  file: (path: string) => ({ fsPath: path }),
  joinPath: (base: any, ...segments: string[]) => ({
    fsPath: [base?.fsPath || base, ...segments].join('/'),
  }),
};

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/workspace' }, name: 'workspace' }],
  textDocuments: [],
  onDidSaveTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  onDidOpenTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  onDidChangeTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  onDidCloseTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  createFileSystemWatcher: vi.fn().mockReturnValue({
    onDidCreate: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    onDidDelete: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    onDidChange: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    dispose: vi.fn(),
  }),
  onDidChangeWorkspaceFolders: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  getConfiguration: vi.fn().mockReturnValue({
    get: (key: string, defaultValue: unknown) => defaultValue,
  }),
  onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
};

export const window = {
  activeTextEditor: undefined,
  registerWebviewViewProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  showInformationMessage: vi.fn(),
  onDidChangeActiveTextEditor: vi.fn().mockReturnValue({ dispose: vi.fn() }),
};

export const commands = {
  registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
};

export class CancellationTokenSource {
  token = { isCancellationRequested: false, onCancellationRequested: vi.fn() };
  cancel() {}
  dispose() {}
}

export default {
  Uri,
  workspace,
  window,
  commands,
  CancellationTokenSource,
};
