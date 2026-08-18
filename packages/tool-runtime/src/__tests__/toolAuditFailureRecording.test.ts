import { describe, it, expect, vi } from 'vitest';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';

describe('ToolExecutor Audit Failure Status Recording Suite', () => {
  it('1. correctly records status FAILED and errorCode when tool handler returns success: false', async () => {
    const registry = new ToolRegistry();
    const repository = new ToolExecutionRepository();
    const auditor = new ToolExecutionAuditor(undefined, undefined, undefined, 'global', repository);
    const permissionManager = new ToolPermissionManager({ defaultPermission: 'ALLOW' });
    const executor = new ToolExecutor(registry, permissionManager, auditor);

    // Register a tool that returns a domain failure result
    registry.register({
      name: 'failing_tool',
      description: 'Returns domain failure',
      parameters: { type: 'object', properties: {} },
      execute: async () => ({
        success: false,
        content: { error: 'Symbol not found' },
        error: { code: 'NOT_FOUND', message: 'Symbol not found' },
      }),
    });

    const { executionResult } = await executor.executeCall({
      id: 'tc_fail_01',
      name: 'failing_tool',
      arguments: {},
    });

    expect(executionResult.success).toBe(false);

    // Verify audit repository entry
    const entries = repository.listAll();
    expect(entries.length).toBe(1);
    const entry = entries[0];

    expect(entry.status).toBe('FAILED');
    expect(entry.errorCode).toBe('NOT_FOUND');

    // Verify analytics reflects 1 failed execution, 0 successful executions
    const analytics = await auditor.getAnalytics();
    expect(analytics.totalCount).toBe(1);
    expect(analytics.successCount).toBe(0);
    expect(analytics.failureCount).toBe(1);
    expect(analytics.successRate).toBe(0);
    expect(analytics.errorCountsByCode['NOT_FOUND']).toBe(1);
  });
});
