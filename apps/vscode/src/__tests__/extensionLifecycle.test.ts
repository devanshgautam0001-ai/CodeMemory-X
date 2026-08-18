import { describe, it, expect, vi } from 'vitest';
import { activate, deactivate } from '../extension.js';

vi.mock('vscode', () => {
  return {
    Uri: {
      file: (path: string) => ({ fsPath: path }),
    },
    workspace: {
      getConfiguration: vi.fn().mockReturnValue({
        get: (key: string, defaultValue: unknown) => defaultValue,
      }),
      onDidChangeConfiguration: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    },
    commands: {
      registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
    },
    window: {
      registerWebviewViewProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
      showInformationMessage: vi.fn(),
    },
  };
});

describe('Extension Lifecycle Activation & Deactivation', () => {
  it('should activate extension host cleanly and register subscriptions', () => {
    const mockSubscriptions: { dispose: Function }[] = [];
    const mockContext: any = {
      subscriptions: mockSubscriptions,
      extensionUri: { fsPath: '/test' },
    };

    expect(() => activate(mockContext)).not.toThrow();
    expect(mockSubscriptions.length).toBeGreaterThan(0);
  });

  it('should deactivate extension host cleanly', () => {
    expect(() => deactivate()).not.toThrow();
  });
});
