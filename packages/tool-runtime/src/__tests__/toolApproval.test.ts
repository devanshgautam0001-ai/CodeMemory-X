import { describe, it, expect } from 'vitest';
import { ToolApprovalManager } from '../permissions/ToolApprovalManager.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { BuiltInTools } from '../builtin/BuiltInTools.js';

describe('ToolApprovalManager & Human-in-the-Loop Unit Tests', () => {
  it('handles approval lifecycle states: PENDING -> APPROVED', async () => {
    const mgr = new ToolApprovalManager();
    const req = mgr.createRequest('req_1', 'tc_1', 'search_memories', { query: 'auth' });

    expect(req.state).toBe('PENDING');
    expect(mgr.getPendingApprovals()).toHaveLength(1);

    setTimeout(() => {
      mgr.respondApproval(req.approvalId, 'APPROVED');
    }, 10);

    const resState = await mgr.waitForApproval(req.approvalId);
    expect(resState).toBe('APPROVED');
    expect(mgr.getPendingApprovals()).toHaveLength(0);
  });

  it('handles approval lifecycle states: PENDING -> DENIED', async () => {
    const mgr = new ToolApprovalManager();
    const req = mgr.createRequest('req_2', 'tc_2', 'search_memories', { query: 'secret' });

    expect(req.state).toBe('PENDING');

    setTimeout(() => {
      mgr.respondApproval(req.approvalId, 'DENIED');
    }, 10);

    const resState = await mgr.waitForApproval(req.approvalId);
    expect(resState).toBe('DENIED');
  });

  it('pauses ToolExecutor on REQUIRE_CONFIRMATION and resumes when approved', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'search_memories',
      description: 'Search memories',
      parameters: { type: 'object', properties: { query: { type: 'string' } } },
      execute: async () => ({ success: true, content: { results: ['memory_1'] } }),
    });

    const permManager = new ToolPermissionManager({
      toolPermissions: {
        search_memories: 'REQUIRE_CONFIRMATION',
      },
    });

    const approvalManager = new ToolApprovalManager();
    const auditor = new ToolExecutionAuditor();
    const executor = new ToolExecutor(registry, permManager, auditor);

    let capturedApprovalId = '';
    const execPromise = executor.executeCall(
      { id: 'tc_3', name: 'search_memories', arguments: { query: 'test' } },
      {
        requestId: 'req_3',
        executionId: 'exec_3',
        toolCallId: 'tc_3',
        approvalManager,
        onApprovalRequest: (req) => {
          capturedApprovalId = req.approvalId;
        },
      }
    );

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(capturedApprovalId).toBeTruthy();

    approvalManager.respondApproval(capturedApprovalId, 'APPROVED');

    const result = await execPromise;
    expect(result.normalizedResult.isError).toBe(false);
  });
});
