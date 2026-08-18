import { describe, it, expect } from 'vitest';
import { ToolApprovalManager } from '../permissions/ToolApprovalManager.js';

describe('ToolApprovalManager Memory Bounds & Eviction Suite', () => {
  it('1. evicts oldest resolved approval records when capacity exceeds 5000', () => {
    const manager = new ToolApprovalManager();

    // Create 5001 requests and respond to the first 5000 immediately
    const reqs = [];
    for (let i = 0; i < 5001; i++) {
      const req = manager.createRequest(`req_${i}`, `tc_${i}`, 'test_tool', {});
      reqs.push(req);
      if (i < 5000) {
        manager.respondApproval(req.approvalId, 'APPROVED');
      }
    }

    // The total approvals count should now be capped at 5000
    const records = manager.getAllRecords();
    expect(records.length).toBe(5000);

    // The oldest resolved approval (index 0) should have been evicted
    expect(manager.getApprovalById(reqs[0].approvalId)).toBeUndefined();
    // The latest pending request (index 5000) should remain intact
    expect(manager.getApprovalById(reqs[5000].approvalId)).toBeDefined();
    expect(manager.getApprovalById(reqs[5000].approvalId)?.state).toBe('PENDING');
  });
});
