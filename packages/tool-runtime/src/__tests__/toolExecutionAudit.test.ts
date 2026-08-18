import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAudit } from '../types/ToolExecutionAudit.js';

function makeMockEventStore() {
  return {
    appendEvent: vi.fn().mockResolvedValue({ isSuccess: true, isFailure: false }),
  };
}

describe('ToolExecutionAudit & Repository & Auditor — TASK-048', () => {
  let repository: ToolExecutionRepository;

  beforeEach(() => {
    repository = new ToolExecutionRepository();
  });

  it('Repository upserts and updates status deterministically', () => {
    const audit: ToolExecutionAudit = {
      executionId: 'exec_100',
      requestId: 'req_1',
      conversationId: 'conv_1',
      toolCallId: 'tc_1',
      toolName: 'read_file',
      status: 'REQUESTED',
      createdAt: 1000,
      sequence: 1,
    };

    repository.upsert(audit);
    expect(repository.get('exec_100')?.status).toBe('REQUESTED');

    const updated = repository.updateStatus('exec_100', 'STARTED', { startedAt: 1050 });
    expect(updated?.status).toBe('STARTED');
    expect(updated?.startedAt).toBe(1050);

    const completed = repository.updateStatus('exec_100', 'COMPLETED', {
      completedAt: 1150,
      durationMs: 100,
    });
    expect(completed?.status).toBe('COMPLETED');
    expect(completed?.durationMs).toBe(100);
  });

  it('Repository manages sequence per requestId', () => {
    expect(repository.nextSequence('req_A')).toBe(1);
    expect(repository.nextSequence('req_A')).toBe(2);
    expect(repository.nextSequence('req_B')).toBe(1);
    expect(repository.nextSequence('req_A')).toBe(3);
  });

  it('Repository filters by conversationId and requestId', () => {
    repository.upsert({
      executionId: 'e1',
      requestId: 'r1',
      conversationId: 'c1',
      toolCallId: 't1',
      toolName: 'tool1',
      status: 'COMPLETED',
      createdAt: 100,
      sequence: 1,
    });
    repository.upsert({
      executionId: 'e2',
      requestId: 'r1',
      conversationId: 'c1',
      toolCallId: 't2',
      toolName: 'tool2',
      status: 'COMPLETED',
      createdAt: 200,
      sequence: 2,
    });
    repository.upsert({
      executionId: 'e3',
      requestId: 'r2',
      conversationId: 'c2',
      toolCallId: 't3',
      toolName: 'tool3',
      status: 'COMPLETED',
      createdAt: 300,
      sequence: 1,
    });

    const c1Entries = repository.getByConversation('c1');
    expect(c1Entries).toHaveLength(2);
    expect(c1Entries[0].executionId).toBe('e1');
    expect(c1Entries[1].executionId).toBe('e2');

    const r1Entries = repository.getByRequest('r1');
    expect(r1Entries).toHaveLength(2);
    expect(r1Entries[0].sequence).toBe(1);
    expect(r1Entries[1].sequence).toBe(2);
  });

  it('Auditor executes full lifecycle status transitions', () => {
    const auditor = new ToolExecutionAuditor();

    const req = auditor.recordRequested({
      executionId: 'exec_200',
      requestId: 'req_20',
      conversationId: 'conv_20',
      toolCallId: 'tc_20',
      toolName: 'delete_file',
    });
    expect(req.status).toBe('REQUESTED');

    auditor.recordWaitingApproval('exec_200', 'appr_99');
    expect(auditor.getEntry('exec_200')?.status).toBe('WAITING_APPROVAL');
    expect(auditor.getEntry('exec_200')?.approvalRequestId).toBe('appr_99');

    auditor.recordApprovalOutcome('exec_200', 'APPROVED');
    expect(auditor.getEntry('exec_200')?.status).toBe('APPROVED');

    auditor.recordStarted('exec_200');
    expect(auditor.getEntry('exec_200')?.status).toBe('STARTED');

    auditor.recordCompleted('exec_200', 45, true);
    expect(auditor.getEntry('exec_200')?.status).toBe('COMPLETED');
    expect(auditor.getEntry('exec_200')?.durationMs).toBe(45);
  });

  it('Auditor persists TOOL_EXECUTION_AUDIT events to EventStore without arguments', async () => {
    const mockStore = makeMockEventStore();
    const auditor = new ToolExecutionAuditor(undefined, undefined, mockStore as any, 'workspace');

    auditor.recordRequested({
      executionId: 'exec_300',
      requestId: 'req_30',
      conversationId: 'conv_30',
      toolCallId: 'tc_30',
      toolName: 'query_db',
    });

    expect(mockStore.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'TOOL_EXECUTION_AUDIT',
        source: 'tool-runtime',
        workspace: 'workspace',
        payload: expect.objectContaining({
          executionId: 'exec_300',
          toolName: 'query_db',
          status: 'REQUESTED',
        }),
      })
    );
  });
});
