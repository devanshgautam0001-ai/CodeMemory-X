import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: [path.resolve(__dirname, './src/__tests__/setup.ts')],
    server: {
      deps: {
        inline: ['@codememory/workspace-watcher'],
      },
    },
  },
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, './src/__mocks__/vscode.ts'),
    },
  },
});
