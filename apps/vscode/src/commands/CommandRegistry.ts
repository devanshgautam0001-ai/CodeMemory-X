import * as vscode from 'vscode';
import { CommandDispatcher } from './CommandDispatcher.js';
import { SidebarWebviewProvider } from '../providers/SidebarWebviewProvider.js';
import { ILogger } from '@codememory/logging';

export class CommandRegistry {
  private readonly dispatcher: CommandDispatcher;

  constructor(private readonly logger?: ILogger) {
    this.dispatcher = new CommandDispatcher(logger);
  }

  public registerAll(
    context: vscode.ExtensionContext,
    getSidebarProvider?: () => SidebarWebviewProvider | undefined
  ): void {
    const openDashboardDisposable = this.dispatcher.registerCommand(
      'codememory.openDashboard',
      async () => {
        await vscode.commands.executeCommand('codememory.sidebarView.focus');
        getSidebarProvider?.()?.switchTab('dashboard');
      }
    );

    const openTimelineDisposable = this.dispatcher.registerCommand(
      'codememory.openTimeline',
      async () => {
        await vscode.commands.executeCommand('codememory.sidebarView.focus');
        getSidebarProvider?.()?.switchTab('timeline');
      }
    );

    const openGraphDisposable = this.dispatcher.registerCommand(
      'codememory.openGraph',
      async () => {
        await vscode.commands.executeCommand('codememory.sidebarView.focus');
        getSidebarProvider?.()?.switchTab('graph');
      }
    );

    const recordDecisionDisposable = this.dispatcher.registerCommand(
      'codememory.recordDecision',
      async () => {
        await vscode.commands.executeCommand('codememory.sidebarView.focus');
        getSidebarProvider?.()?.switchTab('dashboard');
      }
    );

    const showStoryDisposable = this.dispatcher.registerCommand(
      'codememory.showStory',
      async () => {
        await vscode.commands.executeCommand('codememory.sidebarView.focus');
        getSidebarProvider?.()?.switchTab('story');
      }
    );

    const showStatusDisposable = this.dispatcher.registerCommand(
      'codememory.showStatus',
      () => {
        vscode.window.showInformationMessage('CodeMemory X: Repository Initialized');
      }
    );

    context.subscriptions.push(
      openDashboardDisposable,
      openTimelineDisposable,
      openGraphDisposable,
      recordDecisionDisposable,
      showStoryDisposable,
      showStatusDisposable
    );

    this.logger?.info('All VS Code extension commands registered successfully.');
  }
}
