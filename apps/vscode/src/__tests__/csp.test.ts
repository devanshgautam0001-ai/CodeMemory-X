import { describe, it, expect, vi } from 'vitest';
import { SidebarWebviewProvider } from '../providers/SidebarWebviewProvider.js';

vi.mock('vscode', () => {
  return {
    Uri: {
      joinPath: (base: any, ...segments: string[]) => ({
        fsPath: [base.fsPath, ...segments].join('/'),
      }),
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

describe('SidebarWebviewProvider CSP Hardening', () => {
  it('generates Webview HTML containing strict Content-Security-Policy meta header', () => {
    const dummyUri = { fsPath: '/test/ext' } as any;
    const provider = new SidebarWebviewProvider(dummyUri);

    const mockWebview = {
      options: {},
      cspSource: 'vscode-webview:',
      asWebviewUri: (uri: any) => uri.fsPath || 'vscode-webview://asset',
    } as any;

    const html = (provider as any).getHtmlForWebview(mockWebview);

    expect(html).toContain('http-equiv="Content-Security-Policy"');
    expect(html).toContain('default-src \'none\'');
    expect(html).toContain('vscode-webview:');
  });
});
