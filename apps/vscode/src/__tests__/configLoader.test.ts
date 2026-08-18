import { describe, it, expect, vi } from 'vitest';
import { ConfigurationLoader } from '../config/ConfigurationLoader.js';

vi.mock('vscode', () => {
  return {
    workspace: {
      getConfiguration: vi.fn().mockReturnValue({
        get: (key: string, defaultValue: unknown) => {
          if (key === 'enableTelemetry') return true;
          if (key === 'contextRadius') return 3;
          return defaultValue;
        },
      }),
      onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    },
  };
});

describe('ConfigurationLoader Unit Tests', () => {
  it('should load default configuration settings', () => {
    const loader = new ConfigurationLoader();
    const config = loader.loadConfig();

    expect(config.enableTelemetry).toBe(true);
    expect(config.contextRadius).toBe(3);
  });

  it('should register workspace configuration change listener', () => {
    const loader = new ConfigurationLoader();
    const mockCallback = vi.fn();
    const disposable = loader.registerChangeListener(mockCallback);

    expect(disposable).toBeDefined();
    expect(disposable.dispose).toBeDefined();
  });
});
