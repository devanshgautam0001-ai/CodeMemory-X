import * as vscode from 'vscode';
import { ILogger } from '@codememory/logging';

export type CommandHandler = (...args: unknown[]) => Promise<unknown> | unknown;

export class CommandDispatcher {
  constructor(private readonly logger?: ILogger) {}

  public registerCommand(
    commandId: string,
    handler: CommandHandler
  ): vscode.Disposable {
    return vscode.commands.registerCommand(commandId, async (...args: unknown[]) => {
      this.logger?.info(`Executing command: ${commandId}`);
      try {
        return await handler(...args);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger?.error(`Error executing command ${commandId}`, err);
        vscode.window.showErrorMessage(`CodeMemory X Error [${commandId}]: ${err.message}`);
      }
    });
  }
}
