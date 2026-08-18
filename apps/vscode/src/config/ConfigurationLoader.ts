import * as vscode from 'vscode';
import { ILogger } from '@codememory/logging';

export interface CodeMemoryConfig {
  enableTelemetry: boolean;
  contextRadius: number;
}

export class ConfigurationLoader {
  constructor(private readonly logger?: ILogger) {}

  public loadConfig(): CodeMemoryConfig {
    const config = vscode.workspace.getConfiguration('codememory');
    const enableTelemetry = config.get<boolean>('enableTelemetry', true);
    const contextRadius = config.get<number>('contextRadius', 3);

    this.logger?.info('Loaded CodeMemory X configuration', { enableTelemetry, contextRadius });
    return { enableTelemetry, contextRadius };
  }

  public registerChangeListener(
    onChanged: (newConfig: CodeMemoryConfig) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('codememory')) {
        const newConfig = this.loadConfig();
        onChanged(newConfig);
      }
    });
  }
}
