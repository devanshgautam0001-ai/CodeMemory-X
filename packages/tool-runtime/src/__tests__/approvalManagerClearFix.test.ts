import { describe, it, expect } from 'vitest';
import { ToolApprovalManager } from '../permissions/ToolApprovalManager.js';

describe('ToolApprovalManager clearAll Fix', () => {
  it('should resolve pending waitForApproval promises with CANCELLED when clearAll() is called', async () => {
    const manager = new ToolApprovalManager();
    const req = manager.createRequest('req_1', 'tc_1', 'search_memories', {});

    const waitPromise = manager.waitForApproval(req.approvalId, 60000);

    // Call clearAll() while request is still pending
    manager.clearAll();

    const state = await waitPromise;
    expect(state).toBe('CANCELLED');
  });

  it('should resolve pending waitForApproval promises with CANCELLED when dispose() is called', async () => {
    const manager = new ToolApprovalManager();
    const req = manager.createRequest('req_2', 'tc_2', 'get_symbol_story', {});

    const waitPromise = manager.waitForApproval(req.approvalId, 60000);

    manager.dispose();

    const state = await waitPromise;
    expect(state).toBe('CANCELLED');
  });
});
