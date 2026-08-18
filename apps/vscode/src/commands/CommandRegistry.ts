import * as vscode from 'vscode';
import { CommandDispatcher } from './CommandDispatcher.js';
import { ILogger } from '@codememory/logging';

export class CommandRegistry {
  private readonly dispatcher: CommandDispatcher;

  constructor(private readonly logger?: ILogger) {
    this.dispatcher = new CommandDispatcher(logger);
  }

  public registerAll(context: vscode.ExtensionContext): void {
    const openDashboardDisposable = this.dispatcher.registerCommand(
      'codememory.openDashboard',
      () => {
        vscode.window.showInformationMessage('CodeMemory X: Memory Dashboard Loaded');
      }
    );

    const recordDecisionDisposable = this.dispatcher.registerCommand(
      'codememory.recordDecision',
      () => {
        vscode.window.showInformationMessage('CodeMemory X: ADR Capture Prompt Ready');
      }
    );

    const showStoryDisposable = this.dispatcher.registerCommand(
      'codememory.showStory',
      () => {
        vscode.window.showInformationMessage('CodeMemory X: Symbol Story Lineage Active');
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
      recordDecisionDisposable,
      showStoryDisposable,
      showStatusDisposable
    );

    this.logger?.info('All VS Code extension commands registered successfully.');
  }
}
