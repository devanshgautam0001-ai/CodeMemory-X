import { describe, it, expect } from 'vitest';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';

describe('SecurityBoundary Unit Tests', () => {
  it('denies unknown or unregistered tools by default', async () => {
    const registry = new ToolRegistry();
    const permManager = new ToolPermissionManager({ defaultPermission: 'DENY' });
    const executor = new ToolExecutor(registry, permManager, new ToolExecutionAuditor());

    const { executionResult } = await executor.executeCall({
      id: 'tc1',
      name: 'unregistered_shell_tool',
      arguments: {},
    });

    expect(executionResult.success).toBe(false);
    expect(executionResult.error?.code).toBe('TOOL_NOT_FOUND');
  });

  it('rejects execution when registered tool is DENIED by permission manager', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'denied_tool',
      parameters: {},
      execute: async () => ({ success: true, content: 'should not run' }),
    });

    const permManager = new ToolPermissionManager({
      toolPermissions: { denied_tool: 'DENY' },
    });
    const executor = new ToolExecutor(registry, permManager, new ToolExecutionAuditor());

    const { executionResult } = await executor.executeCall({
      id: 'tc2',
      name: 'denied_tool',
      arguments: {},
    });

    expect(executionResult.success).toBe(false);
    expect(executionResult.error?.code).toBe('PERMISSION_DENIED');
  });

  it('returns CONFIRMATION_REQUIRED error when permission is set to REQUIRE_CONFIRMATION', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'confirm_tool',
      parameters: {},
      execute: async () => ({ success: true, content: 'confirm first' }),
    });

    const permManager = new ToolPermissionManager({
      toolPermissions: { confirm_tool: 'REQUIRE_CONFIRMATION' },
    });
    const executor = new ToolExecutor(registry, permManager, new ToolExecutionAuditor());

    const { executionResult } = await executor.executeCall({
      id: 'tc3',
      name: 'confirm_tool',
      arguments: {},
    });

    expect(executionResult.success).toBe(false);
    expect(executionResult.error?.code).toBe('CONFIRMATION_REQUIRED');
  });
});
