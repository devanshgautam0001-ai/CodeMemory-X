import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';

describe('Tool Runtime Cancellation Unit Tests', () => {
  it('cancels tool execution immediately when external AbortSignal triggers', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'cancellable_tool',
      parameters: {},
      execute: async (_, ctx) => {
        return new Promise((resolve, reject) => {
          ctx.signal?.addEventListener('abort', () => {
            const err = new Error('Aborted by user');
            err.name = 'AbortError';
            reject(err);
          });
        });
      },
    });

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10);

    const { executionResult } = await executor.executeCall(
      { id: 'c1', name: 'cancellable_tool', arguments: {} },
      { signal: controller.signal }
    );

    expect(executionResult.success).toBe(false);
    expect(executionResult.error?.code).toBe('ABORTED');
  });

  it('rejects execution immediately if caller AbortSignal is pre-aborted', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'pre_aborted_tool',
      parameters: {},
      execute: async () => ({ success: true, content: 'never' }),
    });

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );

    const controller = new AbortController();
    controller.abort();

    const { executionResult } = await executor.executeCall(
      { id: 'c2', name: 'pre_aborted_tool', arguments: {} },
      { signal: controller.signal }
    );

    expect(executionResult.success).toBe(false);
    expect(executionResult.error?.code).toBe('ABORTED');
  });
});
