import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolApprovalManager } from '../permissions/ToolApprovalManager.js';
import { ToolApprovalRepository } from '../permissions/ToolApprovalRepository.js';

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

function makeEventStore(pendingApprovals: any[] = [], respondedIds: string[] = []) {
  const queryFn = vi.fn((opts: any) => {
    if (opts.eventType === 'TOOL_APPROVAL_REQUESTED') {
      return Promise.resolve({
        isSuccess: true,
        isFailure: false,
        value: pendingApprovals.map((a) => ({ payload: a })),
      });
    }
    if (opts.eventType === 'TOOL_APPROVAL_RESPONDED') {
      return Promise.resolve({
        isSuccess: true,
        isFailure: false,
        value: respondedIds.map((id) => ({ payload: { approvalId: id } })),
      });
    }
    if (opts.eventType === 'TOOL_APPROVAL_EXPIRED') {
      return Promise.resolve({ isSuccess: true, isFailure: false, value: [] });
    }
    return Promise.resolve({ isSuccess: true, isFailure: false, value: [] });
  });

  return {
    appendEvent: vi.fn().mockResolvedValue({ isSuccess: true, isFailure: false }),
    queryEvents: queryFn,
    getEvents: queryFn,
  } as any;
}

// -----------------------------------------------------------------
// ToolApprovalManager tests
// -----------------------------------------------------------------

describe('ToolApprovalManager — TASK-047 hardening', () => {
  let mgr: ToolApprovalManager;

  beforeEach(() => {
    mgr = new ToolApprovalManager();
  });

  it('creates a PENDING approval with a unique approvalId', () => {
    const req = mgr.createRequest('req1', 'tc1', 'search', { q: 'test' });
    expect(req.state).toBe('PENDING');
    expect(req.approvalId).toMatch(/^appr_/);
  });

  it('stale response after approval is resolved is a no-op', async () => {
    const req = mgr.createRequest('req1', 'tc1', 'search', {});
    mgr.respondApproval(req.approvalId, 'APPROVED');
    const staleDeny = mgr.respondApproval(req.approvalId, 'DENIED');
    // State must still be APPROVED — DENIED is stale
    expect(staleDeny?.state).toBe('APPROVED');
  });

  it('cancels approvals scoped to a conversation', () => {
    const r1 = mgr.createRequest('req1', 'tc1', 'search', {}, 60000, 'conv_A');
    const r2 = mgr.createRequest('req2', 'tc2', 'search', {}, 60000, 'conv_B');
    mgr.cancelConversationApprovals('conv_A');
    expect(mgr.getApprovalById(r1.approvalId)?.state).toBe('CANCELLED');
    expect(mgr.getApprovalById(r2.approvalId)?.state).toBe('PENDING');
  });

  it('expireStaleApprovals marks expired entries', () => {
    const req = mgr.createRequest('req1', 'tc1', 'search', {}, -1); // already expired
    const count = mgr.expireStaleApprovals();
    expect(count).toBe(1);
    expect(mgr.getApprovalById(req.approvalId)?.state).toBe('EXPIRED');
  });

  it('cancelAllPending cancels every PENDING request', () => {
    const r1 = mgr.createRequest('req1', 'tc1', 'a', {});
    const r2 = mgr.createRequest('req2', 'tc2', 'b', {});
    mgr.cancelAllPending();
    expect(mgr.getApprovalById(r1.approvalId)?.state).toBe('CANCELLED');
    expect(mgr.getApprovalById(r2.approvalId)?.state).toBe('CANCELLED');
  });

  it('getPendingApprovals returns only PENDING items', () => {
    const r1 = mgr.createRequest('req1', 'tc1', 'a', {});
    const r2 = mgr.createRequest('req2', 'tc2', 'b', {});
    mgr.respondApproval(r1.approvalId, 'APPROVED');
    const pending = mgr.getPendingApprovals();
    expect(pending).toHaveLength(1);
    expect(pending[0].approvalId).toBe(r2.approvalId);
  });

  it('toPersistedRecord produces a serialisable record without live references', () => {
    const req = mgr.createRequest('req1', 'tc1', 'search', { query: 'foo' });
    const record = mgr.toPersistedRecord(req);
    expect(record.requestId).toBe('req1');
    expect(record.status).toBe('PENDING');
    expect(typeof record.createdAt).toBe('number');
    expect(typeof record.expiresAt).toBe('number');
    expect(record.respondedAt).toBeUndefined();
  });
});

// -----------------------------------------------------------------
// ToolApprovalRepository tests
// -----------------------------------------------------------------

describe('ToolApprovalRepository — TASK-047', () => {
  let mgr: ToolApprovalManager;

  beforeEach(() => {
    mgr = new ToolApprovalManager();
  });

  it('persistRequested calls appendEvent with TOOL_APPROVAL_REQUESTED', async () => {
    const store = makeEventStore();
    const repo = new ToolApprovalRepository(store, 'ws1');
    const req = mgr.createRequest('req1', 'tc1', 'search', { q: 'safe' });
    await repo.persistRequested(req);
    expect(store.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TOOL_APPROVAL_REQUESTED' })
    );
  });

  it('persistResponded calls appendEvent with TOOL_APPROVAL_RESPONDED', async () => {
    const store = makeEventStore();
    const repo = new ToolApprovalRepository(store, 'ws1');
    const req = mgr.createRequest('req1', 'tc1', 'search', {});
    mgr.respondApproval(req.approvalId, 'APPROVED');
    await repo.persistResponded(req);
    expect(store.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TOOL_APPROVAL_RESPONDED' })
    );
  });

  it('persistResponded uses TOOL_APPROVAL_EXPIRED for expired state', async () => {
    const store = makeEventStore();
    const repo = new ToolApprovalRepository(store, 'ws1');
    const req = mgr.createRequest('req1', 'tc1', 'search', {}, -1);
    mgr.expireStaleApprovals();
    await repo.persistResponded(req);
    expect(store.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TOOL_APPROVAL_EXPIRED' })
    );
  });

  it('sanitiseArguments strips credential-like keys', async () => {
    const store = makeEventStore();
    const repo = new ToolApprovalRepository(store, 'ws1');
    const req = mgr.createRequest('req1', 'tc1', 'fetch', {
      url: 'https://example.com',
      api_key: 'SECRET123',
      auth: 'Bearer tok',
      safe_param: 'hello',
    });
    await repo.persistRequested(req);
    const call = (store.appendEvent as any).mock.calls[0][0];
    const args = call.payload.arguments;
    expect(args.api_key).toBeUndefined();
    expect(args.auth).toBeUndefined();
    expect(args.url).toBe('https://example.com');
    expect(args.safe_param).toBe('hello');
  });

  it('getPendingApprovals returns PENDING items that have not been responded to', async () => {
    const futureExpiry = new Date(Date.now() + 60000).toISOString();
    const pendingRecord = {
      approvalId: 'appr_1',
      requestId: 'req_1',
      toolCallId: 'tc_1',
      toolName: 'search',
      arguments: {},
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      expiresAt: futureExpiry,
    };
    const store = makeEventStore([pendingRecord], []);
    const repo = new ToolApprovalRepository(store, 'ws1');
    const pending = await repo.getPendingApprovals();
    expect(pending).toHaveLength(1);
    expect(pending[0].approvalId).toBe('appr_1');
  });

  it('getPendingApprovals excludes items that have been responded to', async () => {
    const futureExpiry = new Date(Date.now() + 60000).toISOString();
    const pendingRecord = {
      approvalId: 'appr_2',
      requestId: 'req_2',
      toolCallId: 'tc_2',
      toolName: 'search',
      arguments: {},
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      expiresAt: futureExpiry,
    };
    const store = makeEventStore([pendingRecord], ['appr_2']); // responded
    const repo = new ToolApprovalRepository(store, 'ws1');
    const pending = await repo.getPendingApprovals();
    expect(pending).toHaveLength(0);
  });

  it('getPendingApprovals excludes items past their expiry', async () => {
    const pastExpiry = new Date(Date.now() - 1000).toISOString();
    const pendingRecord = {
      approvalId: 'appr_3',
      requestId: 'req_3',
      toolCallId: 'tc_3',
      toolName: 'search',
      arguments: {},
      status: 'PENDING',
      requestedAt: new Date(Date.now() - 70000).toISOString(),
      expiresAt: pastExpiry,
    };
    const store = makeEventStore([pendingRecord], []);
    const repo = new ToolApprovalRepository(store, 'ws1');
    const pending = await repo.getPendingApprovals();
    expect(pending).toHaveLength(0);
  });
});
