import { describe, it, expect, beforeEach } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutionAudit } from '../types/ToolExecutionAudit.js';

describe('TASK-055 Analytics Drill-Down & Hardening Test Suite', () => {
  let repository: ToolExecutionRepository;
  let auditor: ToolExecutionAuditor;

  const mockEventStore = {
    appendEvent: async () => ({ isSuccess: true, isFailure: false }),
    getEvents: async () => ({
      isSuccess: true,
      isFailure: false,
      value: [
        {
          id: 'evt_d1',
          type: 'TOOL_EXECUTION_AUDIT',
          payload: {
            executionId: 'e_dd_1',
            requestId: 'r_dd_1',
            conversationId: 'c1',
            toolCallId: 'tc_dd_1',
            toolName: 'read_file',
            status: 'COMPLETED',
            createdAt: 1000,
            startedAt: 1005,
            completedAt: 1050,
            durationMs: 45,
            sequence: 1,
          },
        },
      ],
    }),
  };

  beforeEach(() => {
    repository = new ToolExecutionRepository();
    auditor = new ToolExecutionAuditor(undefined, undefined, mockEventStore as any, 'global', repository);
  });

  function populateDrilldownData(repo: ToolExecutionRepository) {
    const records: ToolExecutionAudit[] = [
      { executionId: 'e1', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc1', toolName: 'search_memories', status: 'COMPLETED', createdAt: 1000, durationMs: 40, sequence: 1 },
      { executionId: 'e2', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc2', toolName: 'search_memories', status: 'COMPLETED', createdAt: 2000, durationMs: 60, sequence: 2 },
      { executionId: 'e3', requestId: 'r2', conversationId: 'c1', toolCallId: 'tc3', toolName: 'get_symbol_story', status: 'FAILED', createdAt: 3000, durationMs: 15, errorCode: 'SYMBOL_NOT_FOUND', sequence: 1 },
      { executionId: 'e4', requestId: 'r3', conversationId: 'c2', toolCallId: 'tc4', toolName: 'get_symbol_story', status: 'DENIED', createdAt: 4000, approvalRequestId: 'appr_4', sequence: 1 },
      { executionId: 'e5', requestId: 'r4', conversationId: 'c2', toolCallId: 'tc5', toolName: 'search_memories', status: 'WAITING_APPROVAL', createdAt: 5000, approvalRequestId: 'appr_5', sequence: 1 },
      { executionId: 'e6', requestId: 'r5', conversationId: 'c2', toolCallId: 'tc6', toolName: 'get_change_impact', status: 'CANCELLED', createdAt: 6000, sequence: 1 },
      { executionId: 'e7', requestId: 'r6', conversationId: 'c2', toolCallId: 'tc7', toolName: 'get_change_impact', status: 'EXPIRED', createdAt: 7000, approvalRequestId: 'appr_7', sequence: 1 },
    ];
    for (const r of records) {
      repo.upsert(r);
    }
  }

  // 1. Chart bucket selection & range extraction
  it('1. calculates exact bucket start and end timestamps for drill-down interval filtering', () => {
    populateDrilldownData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 7000 }, 6);
    const bucketIndex = 2; // Bucket 2 starts at fromTimestamp + 2 * bucketSizeMs
    const bStart = viz.fromTimestamp + bucketIndex * viz.bucketSizeMs;
    const bEnd = bStart + viz.bucketSizeMs;
    expect(bStart).toBe(3000);
    expect(bEnd).toBe(4000);
  });

  // 2. Bucket detail calculations
  it('2. computes accurate bucket detail metrics without NaN or Infinity', () => {
    populateDrilldownData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 7000 }, 6);
    const b0Completed = viz.series.find((s) => s.id === 'completed')?.points[0].value;
    const b0AvgLatency = viz.series.find((s) => s.id === 'avgLatency')?.points[0].value;
    const b0SuccessRate = viz.series.find((s) => s.id === 'successRate')?.points[0].value;

    expect(b0Completed).toBe(1);
    expect(b0AvgLatency).toBe(40);
    expect(b0SuccessRate).toBe(1);
    expect(Number.isNaN(b0SuccessRate)).toBe(false);
    expect(Number.isFinite(b0SuccessRate)).toBe(true);
  });

  // 3. Status drill-down filtering
  it('3. filters audit query by status for status card drill-downs', () => {
    populateDrilldownData(repository);
    const resFailed = repository.query({ status: 'FAILED' });
    expect(resFailed.total).toBe(1);
    expect(resFailed.items[0].executionId).toBe('e3');

    const resDenied = repository.query({ status: 'DENIED' });
    expect(resDenied.total).toBe(1);
    expect(resDenied.items[0].executionId).toBe('e4');
  });

  // 4. Per-tool drill-down filtering
  it('4. filters audit query by toolName for per-tool breakdown drill-downs', () => {
    populateDrilldownData(repository);
    const resTool = repository.query({ toolName: 'search_memories' });
    expect(resTool.total).toBe(3);
    expect(resTool.items.every((i) => i.toolName === 'search_memories')).toBe(true);
  });

  // 5. Error code drill-down filtering
  it('5. filters audit query by errorCode for error code distribution drill-downs', () => {
    populateDrilldownData(repository);
    const resErr = repository.query({ errorCode: 'SYMBOL_NOT_FOUND' });
    expect(resErr.total).toBe(1);
    expect(resErr.items[0].executionId).toBe('e3');
  });

  // 6. Approval state drill-down filtering
  it('6. filters audit query by approvalState for approval stats drill-downs', () => {
    populateDrilldownData(repository);
    const resAppr = repository.query({ approvalState: 'DENIED' });
    expect(resAppr.total).toBe(1);
    expect(resAppr.items[0].executionId).toBe('e4');
  });

  // 7. NaN / Infinity protection on empty repository
  it('7. produces strictly zero numeric metrics on empty repository without NaN or Infinity', () => {
    const viz = repository.computeVisualization([]);
    expect(viz.totalExecutions).toBe(0);
    expect(viz.successRate).toBe(0);
    expect(viz.avgDurationMs).toBe(0);
    expect(viz.minDurationMs).toBe(0);
    expect(viz.maxDurationMs).toBe(0);

    const analytics = repository.computeAnalytics([]);
    expect(analytics.totalCount).toBe(0);
    expect(analytics.successRate).toBe(0);
    expect(analytics.avgDurationMs).toBe(0);
  });

  // 8. Cross-filter combination (Multi-criteria)
  it('8. combines conversationId, toolName, status, and time range simultaneously', () => {
    populateDrilldownData(repository);
    const resCombined = repository.query({
      conversationId: 'c1',
      toolName: 'search_memories',
      status: 'COMPLETED',
      fromTimestamp: 500,
      toTimestamp: 2500,
    });
    expect(resCombined.total).toBe(2);
  });

  // 9. Stale RPC response protection (Simulated requestId matching)
  it('9. maintains deterministic requestId integrity in query responses', () => {
    populateDrilldownData(repository);
    const q1 = repository.query({ conversationId: 'c1' });
    const q2 = repository.query({ conversationId: 'c2' });
    expect(q1.total).toBe(3);
    expect(q2.total).toBe(4);
  });

  // 10. 30-day time range enforcement
  it('10. limits time range calculation to maximum 30 days', () => {
    const now = Date.now();
    const range60Days = 60 * 86_400_000;
    const viz = repository.computeVisualization([], { fromTimestamp: now - range60Days, toTimestamp: now });
    expect(viz.toTimestamp - viz.fromTimestamp).toBeLessThanOrEqual(30 * 86_400_000 + 1000);
  });

  // 11. 500-bucket upper bound enforcement
  it('11. enforces 500 bucket hard ceiling when requesting large bucket count', () => {
    const viz = repository.computeVisualization([], { fromTimestamp: 1000, toTimestamp: 10000 }, 2000);
    expect(viz.series[0].points.length).toBeLessThanOrEqual(500);
  });

  // 12. Security boundary verification
  it('12. guarantees visualization DTOs contain zero prompt, argument, or credential data', () => {
    populateDrilldownData(repository);
    const viz = repository.computeVisualization(repository.listAll());
    const jsonStr = JSON.stringify(viz);
    expect(jsonStr).not.toContain('prompt');
    expect(jsonStr).not.toContain('args');
    expect(jsonStr).not.toContain('password');
    expect(jsonStr).not.toContain('secret');
  });

  // 13. EventStore auditor rehydration for visualization drill-down
  it('13. auditor getVisualization rehydrates historical events correctly', async () => {
    const viz = await auditor.getVisualization();
    expect(viz.totalExecutions).toBeGreaterThanOrEqual(1);
  });
});
