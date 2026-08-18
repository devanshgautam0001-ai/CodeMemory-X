import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MessageBridge } from '../bridge/MessageBridge.js';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';
import { ILogger } from '@codememory/logging';

export class SidebarWebviewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  public static readonly viewType = 'codememory.sidebarView';
  private readonly messageBridge: MessageBridge;
  private readonly pipeline: VerticalSlicePipeline;
  private currentWebviewView?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly logger?: ILogger
  ) {
    this.pipeline = new VerticalSlicePipeline(logger);
    this.messageBridge = new MessageBridge(this.pipeline, logger);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Promise<void> {
    this.currentWebviewView = webviewView;

    // Clear previous view disposables to prevent leak on view re-resolution
    this.clearDisposables();

    const webviewDistUri = this.getWebviewDistUri();
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        webviewDistUri,
        vscode.Uri.joinPath(this.extensionUri, 'dist'),
        this.extensionUri,
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Webview to Extension Host Message Listener
    const msgListener = webviewView.webview.onDidReceiveMessage(async (message) => {
      await this.messageBridge.handleMessageFromWebview(message, (msg) => {
        if (this.currentWebviewView) {
          this.currentWebviewView.webview.postMessage(msg);
        }
      });
    });
    this.disposables.push(msgListener);

    // Handle webview view disposal
    const disposeListener = webviewView.onDidDispose(() => {
      this.currentWebviewView = undefined;
      this.clearDisposables();
      this.logger?.info('SidebarWebviewProvider view disposed.');
    });
    this.disposables.push(disposeListener);

    // Initialize Vertical Slice Pipeline on current VS Code workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const workspacePath = workspaceFolders[0].uri.fsPath;
      try {
        await this.pipeline.initialize(workspacePath);
        await this.broadcastPipelineUpdate();
      } catch (err) {
        this.logger?.error('Error initializing vertical slice pipeline in sidebar webview:', err as Error);
      }

      // Listen for Live TypeScript File Edits
      const saveListener = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'typescript' || document.languageId === 'typescriptreact' || document.fileName.endsWith('.ts') || document.fileName.endsWith('.tsx')) {
          this.logger?.info('TypeScript file saved in VS Code workspace:', { fileName: document.fileName });
          const snapshot = await this.pipeline.processTypeScriptFile(document.fileName, document.getText());
          this.sendSnapshotToWebview(snapshot);
        }
      });
      this.disposables.push(saveListener);
    }

    this.logger?.info('SidebarWebviewProvider resolved WebviewView successfully.');
  }

  private clearDisposables(): void {
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch (err) {
        // ignore disposal errors
      }
    }
    this.disposables = [];
  }

  public async dispose(): Promise<void> {
    this.clearDisposables();
    this.currentWebviewView = undefined;
    if (this.pipeline) {
      await this.pipeline.dispose();
    }
    this.logger?.info('SidebarWebviewProvider disposed completely.');
  }

  public async broadcastPipelineUpdate(): Promise<void> {
    if (!this.currentWebviewView) return;
    const activeEditor = vscode.window.activeTextEditor;
    const activePath = activeEditor?.document.fileName;

    const snapshot = await this.pipeline.getLiveSnapshot(activePath);
    this.sendSnapshotToWebview(snapshot);
  }

  private sendSnapshotToWebview(snapshot: any): void {
    if (!this.currentWebviewView) return;
    this.messageBridge.sendToWebview(
      (msg) => this.currentWebviewView?.webview.postMessage(msg),
      'UPDATE_STATE',
      snapshot
    );
  }

  private getWebviewDistUri(): vscode.Uri {
    const internalDistWebview = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
    if (fs.existsSync(internalDistWebview.fsPath)) {
      return internalDistWebview;
    }
    return vscode.Uri.joinPath(this.extensionUri, '..', 'webview', 'dist');
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const webviewDistUri = this.getWebviewDistUri();
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDistUri, 'assets', 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDistUri, 'assets', 'index.css'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; script-src ${webview.cspSource} 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeMemory X</title>
  <link rel="stylesheet" href="${styleUri}">
</head>
<body class="bg-zinc-950 text-zinc-100">
  <div id="root"></div>
  <script type="module" src="${scriptUri}"></script>
</body>
</html>`;
  }
}
