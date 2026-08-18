import { describe, it, expect, vi } from 'vitest';
import { CommandDispatcher } from '../commands/CommandDispatcher.js';

vi.mock('vscode', () => {
  return {
    commands: {
      registerCommand: vi.fn().mockImplementation((id: string, handler: Function) => {
        return {
          id,
          handler,
          dispose: vi.fn(),
        };
      }),
    },
    window: {
      showErrorMessage: vi.fn(),
    },
  };
});

describe('CommandDispatcher Unit Tests', () => {
  it('should register command and return disposable', () => {
    const dispatcher = new CommandDispatcher();
    const mockHandler = vi.fn().mockReturnValue('ok');

    const disposable = dispatcher.registerCommand('test.command', mockHandler);
    expect(disposable).toBeDefined();
  });
});
