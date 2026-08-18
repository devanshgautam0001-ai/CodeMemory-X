import { describe, it, expect, beforeEach } from 'vitest';
import { ToolApprovalManager } from '../permissions/ToolApprovalManager.js';

describe('TASK-059 Approval Race & Terminal State Locking Suite', () => {
  let approvalManager: ToolApprovalManager;

  beforeEach(() => {
    approvalManager = new ToolApprovalManager();
  });

  it('1. locks DENIED state when approve is attempted after deny', () => {
    const req = approvalManager.createRequest('req_1', 'tc_1', 'read_file', {});
    approvalManager.respondApproval(req.approvalId, 'DENIED');

    expect(req.state).toBe('DENIED');

    // Attempt late approve
    approvalManager.respondApproval(req.approvalId, 'APPROVED');
    expect(req.state).toBe('DENIED'); // Remained DENIED
  });

  it('2. locks APPROVED state when deny is attempted after approve', () => {
    const req = approvalManager.createRequest('req_2', 'tc_2', 'search_memories', {});
    approvalManager.respondApproval(req.approvalId, 'APPROVED');

    expect(req.state).toBe('APPROVED');

    // Attempt late deny
    approvalManager.respondApproval(req.approvalId, 'DENIED');
    expect(req.state).toBe('APPROVED'); // Remained APPROVED
  });

  it('3. locks EXPIRED state when approve is attempted after expiry', async () => {
    const req = approvalManager.createRequest('req_3', 'tc_3', 'get_story', {}, 10);
    const p = approvalManager.waitForApproval(req.approvalId, 10);

    const resState = await p;
    expect(resState).toBe('EXPIRED');
    expect(req.state).toBe('EXPIRED');

    // Attempt late approve
    approvalManager.respondApproval(req.approvalId, 'APPROVED');
    expect(req.state).toBe('EXPIRED');
  });

  it('4. locks EXPIRED state when deny is attempted after expiry', async () => {
    const req = approvalManager.createRequest('req_4', 'tc_4', 'get_drift', {}, 10);
    const p = approvalManager.waitForApproval(req.approvalId, 10);

    await p;
    expect(req.state).toBe('EXPIRED');

    // Attempt late deny
    approvalManager.respondApproval(req.approvalId, 'DENIED');
    expect(req.state).toBe('EXPIRED');
  });

  it('5. handles duplicate approval response safely without state corruption', () => {
    const req = approvalManager.createRequest('req_5', 'tc_5', 'read_file', {});
    approvalManager.respondApproval(req.approvalId, 'APPROVED');
    const firstRespondedAt = req.respondedAt;

    // Duplicate response
    approvalManager.respondApproval(req.approvalId, 'APPROVED');
    expect(req.state).toBe('APPROVED');
    expect(req.respondedAt).toBe(firstRespondedAt);
  });

  it('6. cancels pending approvals on conversation switch or clear', () => {
    const req1 = approvalManager.createRequest('req_6a', 'tc_6a', 't1', {}, 60000, 'conv_1');
    const req2 = approvalManager.createRequest('req_6b', 'tc_6b', 't2', {}, 60000, 'conv_1');
    const req3 = approvalManager.createRequest('req_6c', 'tc_6c', 't3', {}, 60000, 'conv_2');

    approvalManager.cancelConversationApprovals('conv_1');

    expect(req1.state).toBe('CANCELLED');
    expect(req2.state).toBe('CANCELLED');
    expect(req3.state).toBe('PENDING');
  });

  it('7. cancels all pending approvals on extension shutdown or clearAll', () => {
    const req1 = approvalManager.createRequest('req_7a', 'tc_7a', 't1', {});
    const req2 = approvalManager.createRequest('req_7b', 'tc_7b', 't2', {});

    approvalManager.clearAll();

    expect(req1.state).toBe('CANCELLED');
    expect(req2.state).toBe('CANCELLED');
    expect(approvalManager.getPendingApprovals()).toEqual([]);
  });
});
