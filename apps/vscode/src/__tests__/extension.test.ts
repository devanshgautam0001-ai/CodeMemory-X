import { describe, it, expect, vi } from 'vitest';
import { SidebarWebviewProvider } from '../providers/SidebarWebviewProvider.js';

vi.mock('vscode', () => {
  return {
    Uri: {
      file: (path: string) => ({ fsPath: path }),
      joinPath: (base: any, ...segments: string[]) => ({ fsPath: [base.fsPath, ...segments].join('/') }),
    },
    workspace: {
      workspaceFolders: [],
      onDidSaveTextDocument: vi.fn(),
    },
    window: {
      activeTextEditor: undefined,
    },
  };
});

describe('SidebarWebviewProvider Unit Tests', () => {
  it('should instantiate SidebarWebviewProvider with viewType constant', () => {
    expect(SidebarWebviewProvider.viewType).toBe('codememory.sidebarView');
  });
});
