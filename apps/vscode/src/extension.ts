import * as vscode from 'vscode';
import { CommandRegistry } from './commands/CommandRegistry.js';
import { SidebarWebviewProvider } from './providers/SidebarWebviewProvider.js';
import { ConfigurationLoader } from './config/ConfigurationLoader.js';
import { ConsoleLogger, LogLevel, ILogger } from '@codememory/logging';

let logger: ILogger;
let sidebarProvider: SidebarWebviewProvider | undefined;

export function activate(context: vscode.ExtensionContext): void {
  logger = new ConsoleLogger(LogLevel.INFO);
  logger.info('Activating CodeMemory X Extension Host...');

  // Configuration initialization
  const configLoader = new ConfigurationLoader(logger);
  const currentConfig = configLoader.loadConfig();
  const configDisposable = configLoader.registerChangeListener((updatedConfig) => {
    logger.info('Configuration updated dynamically', { updatedConfig });
  });
  context.subscriptions.push(configDisposable);

  // Command Registry initialization
  const commandRegistry = new CommandRegistry(logger);
  commandRegistry.registerAll(context);

  // Sidebar Webview Provider registration
  sidebarProvider = new SidebarWebviewProvider(context.extensionUri, logger);
  const viewDisposable = vscode.window.registerWebviewViewProvider(
    SidebarWebviewProvider.viewType,
    sidebarProvider
  );
  context.subscriptions.push(sidebarProvider, viewDisposable);

  logger.info('CodeMemory X Extension Host successfully activated.', { currentConfig });
}

export async function deactivate(): Promise<void> {
  if (logger) {
    logger.info('Deactivating CodeMemory X Extension Host...');
  }
  if (sidebarProvider) {
    await sidebarProvider.dispose();
    sidebarProvider = undefined;
  }
}
