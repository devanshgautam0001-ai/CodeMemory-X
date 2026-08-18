import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';

describe('Tool Runtime Timeout Unit Tests', () => {
  it('aborts tool handler and returns TIMEOUT error if execution exceeds configured limit', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'slow_tool',
      parameters: {},
      execute: async (_, ctx) => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve({ success: true, content: 'done' }), 200);
          ctx.signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      },
    });

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor(),
      { defaultTimeoutMs: 30 }
    );

    const { executionResult } = await executor.executeCall({
      id: 'c1',
      name: 'slow_tool',
      arguments: {},
    });

    expect(executionResult.success).toBe(false);
    expect(executionResult.error?.code).toBe('TIMEOUT');
  });
});
