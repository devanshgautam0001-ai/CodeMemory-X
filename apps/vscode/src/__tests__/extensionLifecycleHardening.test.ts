import { describe, it, expect, vi } from 'vitest';

vi.mock('vscode', () => {
  return {
    Uri: {
      file: (path: string) => ({ fsPath: path }),
      joinPath: (base: any, ...segments: string[]) => ({
        fsPath: [base?.fsPath || base, ...segments].join('/'),
      }),
    },
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/workspace' }, name: 'workspace' }],
      textDocuments: [],
      onDidSaveTextDocument: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      getConfiguration: vi.fn().mockReturnValue({
        get: (key: string, defaultValue: unknown) => defaultValue,
      }),
      onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    },
    window: {
      activeTextEditor: undefined,
      registerWebviewViewProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      showInformationMessage: vi.fn(),
    },
    commands: {
      registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    },
  };
});

import { SidebarWebviewProvider } from '../providers/SidebarWebviewProvider.js';
import { deactivate } from '../extension.js';

describe('Extension Lifecycle & Sidebar Provider Disposal Hardening Suite', () => {
  it('1. SidebarWebviewProvider implements Disposable and cleans up listeners on dispose()', async () => {
    const mockUri = { fsPath: '/test/extension' } as any;
    const provider = new SidebarWebviewProvider(mockUri);

    const mockWebviewView = {
      webview: {
        options: {},
        html: '',
        asWebviewUri: (uri: any) => uri,
        cspSource: 'https://test.csp',
        onDidReceiveMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
        postMessage: vi.fn(),
      },
      onDidDispose: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    } as any;

    await provider.resolveWebviewView(mockWebviewView, {} as any, {} as any);

    // Call provider dispose
    await provider.dispose();

    // Verify currentWebviewView is cleared and disposables array is reset
    expect((provider as any).currentWebviewView).toBeUndefined();
    expect((provider as any).disposables.length).toBe(0);
  });

  it('2. deactivate() disposes sidebarProvider cleanly without unhandled errors', async () => {
    await expect(deactivate()).resolves.not.toThrow();
  });
});
