import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutionAudit } from '../types/ToolExecutionAudit.js';

describe('ToolExecutionAnalytics & Querying — TASK-049', () => {
  let repository: ToolExecutionRepository;

  beforeEach(() => {
    repository = new ToolExecutionRepository();
  });

  function populateSampleData(repo: ToolExecutionRepository) {
    const items: ToolExecutionAudit[] = [
      {
        executionId: 'e1',
        requestId: 'r1',
        conversationId: 'c1',
        toolCallId: 'tc1',
        toolName: 'read_file',
        status: 'COMPLETED',
        createdAt: 1000,
        startedAt: 1005,
        completedAt: 1055,
        durationMs: 50,
        sequence: 1,
      },
      {
        executionId: 'e2',
        requestId: 'r1',
        conversationId: 'c1',
        toolCallId: 'tc2',
        toolName: 'read_file',
        status: 'COMPLETED',
        createdAt: 2000,
        startedAt: 2005,
        completedAt: 2105,
        durationMs: 100,
        sequence: 2,
      },
      {
        executionId: 'e3',
        requestId: 'r2',
        conversationId: 'c1',
        toolCallId: 'tc3',
        toolName: 'write_file',
        status: 'FAILED',
        createdAt: 3000,
        startedAt: 3005,
        completedAt: 3025,
        durationMs: 20,
        errorCode: 'PERMISSION_DENIED',
        sequence: 1,
      },
      {
        executionId: 'e4',
        requestId: 'r3',
        conversationId: 'c2',
        toolCallId: 'tc4',
        toolName: 'write_file',
        status: 'DENIED',
        createdAt: 4000,
        approvalRequestId: 'appr_4',
        sequence: 1,
      },
      {
        executionId: 'e5',
        requestId: 'r4',
        conversationId: 'c2',
        toolCallId: 'tc5',
        toolName: 'read_file',
        status: 'WAITING_APPROVAL',
        createdAt: 5000,
        approvalRequestId: 'appr_5',
        sequence: 1,
      },
    ];

    for (const item of items) {
      repo.upsert(item);
    }
  }

  it('filters executions by status, conversationId, toolName, and timestamp range', () => {
    populateSampleData(repository);

    const c1Res = repository.query({ conversationId: 'c1' });
    expect(c1Res.total).toBe(3);
    expect(c1Res.items).toHaveLength(3);

    const readRes = repository.query({ toolName: 'READ_FILE' });
    expect(readRes.total).toBe(3);

    const failedRes = repository.query({ status: 'FAILED' });
    expect(failedRes.total).toBe(1);
    expect(failedRes.items[0].executionId).toBe('e3');

    const rangeRes = repository.query({ fromTimestamp: 2000, toTimestamp: 4000 });
    expect(rangeRes.total).toBe(3);
  });

  it('handles pagination offset and limit correctly', () => {
    populateSampleData(repository);

    const page1 = repository.query({ limit: 2, offset: 0 });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.hasMore).toBe(true);

    const page2 = repository.query({ limit: 2, offset: 2 });
    expect(page2.items).toHaveLength(2);
    expect(page2.hasMore).toBe(true);

    const page3 = repository.query({ limit: 2, offset: 4 });
    expect(page3.items).toHaveLength(1);
    expect(page3.hasMore).toBe(false);
  });

  it('computes aggregated metrics, latency averages, and per-tool breakdowns', () => {
    populateSampleData(repository);

    const analytics = repository.computeAnalytics(repository.listAll());
    expect(analytics.totalCount).toBe(5);
    // TASK-051: new canonical field names
    expect(analytics.successCount).toBe(2);
    expect(analytics.failureCount).toBe(1);
    expect(analytics.deniedCount).toBe(1);
    expect(analytics.waitingApprovalCount).toBe(1);
    // TASK-051: backward compat aliases still present
    expect(analytics.completedCount).toBe(2);
    expect(analytics.failedCount).toBe(1);
    expect(analytics.successRate).toBe(0.4); // 2 completed / 5 total
    expect(analytics.avgDurationMs).toBe(57); // (50 + 100 + 20) / 3 = 56.666 -> 57
    // TASK-051: new latency fields
    expect(analytics.totalDurationMs).toBe(170); // 50 + 100 + 20
    expect(analytics.minDurationMs).toBe(20);
    expect(analytics.maxDurationMs).toBe(100);
    expect(analytics.errorCountsByCode['PERMISSION_DENIED']).toBe(1);

    // TASK-051: byTool is now an array sorted by totalExecutions desc
    expect(Array.isArray(analytics.byTool)).toBe(true);
    const readMetrics = analytics.byTool.find((m) => m.toolName === 'read_file');
    expect(readMetrics).toBeDefined();
    expect(readMetrics!.totalExecutions).toBe(3);
    expect(readMetrics!.successCount).toBe(2);
    expect(readMetrics!.avgDurationMs).toBe(75); // (50 + 100) / 2 = 75
    expect(readMetrics!.minDurationMs).toBe(50);
    expect(readMetrics!.maxDurationMs).toBe(100);

    const writeMetrics = analytics.byTool.find((m) => m.toolName === 'write_file');
    expect(writeMetrics).toBeDefined();
    expect(writeMetrics!.totalExecutions).toBe(2);
    expect(writeMetrics!.failureCount).toBe(1);
    expect(writeMetrics!.denialCount).toBe(1);

    // byTool sorted by totalExecutions descending
    expect(analytics.byTool[0].toolName).toBe('read_file'); // 3 executions
    expect(analytics.byTool[1].toolName).toBe('write_file'); // 2 executions
  });

  it('Auditor rehydrates historical events from EventStore and computes analytics', async () => {
    const mockEvents: ToolExecutionAudit[] = [
      {
        executionId: 'hist_1',
        requestId: 'req_h1',
        conversationId: 'conv_hist',
        toolCallId: 'tc_h1',
        toolName: 'search_symbols',
        status: 'COMPLETED',
        createdAt: 100,
        startedAt: 105,
        completedAt: 145,
        durationMs: 40,
        sequence: 1,
      },
    ];

    const mockEventStore = {
      appendEvent: vi.fn(),
      getEvents: vi.fn().mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: mockEvents.map((evt) => ({ payload: evt })),
      }),
    };

    const auditor = new ToolExecutionAuditor(undefined, undefined, mockEventStore as any, 'workspace');

    const res = await auditor.queryExecutions({ conversationId: 'conv_hist' });
    expect(mockEventStore.getEvents).toHaveBeenCalledWith({
      workspace: 'workspace',
      eventType: 'TOOL_EXECUTION_AUDIT',
      limit: 1000,
    });
    expect(res.total).toBe(1);
    expect(res.items[0].executionId).toBe('hist_1');

    const analytics = await auditor.getAnalytics({ conversationId: 'conv_hist' });
    expect(analytics.totalCount).toBe(1);
    // TASK-051: new canonical field names
    expect(analytics.successCount).toBe(1);
    // backward compat alias still works
    expect(analytics.completedCount).toBe(1);
    const toolMetrics = analytics.byTool.find((m) => m.toolName === 'search_symbols');
    expect(toolMetrics?.avgDurationMs).toBe(40);
  });

  it('TASK-051: exportToJson returns secrets-free rows with ISO timestamps', () => {
    populateSampleData(repository);

    const rows = repository.exportToJson();
    expect(rows).toHaveLength(5);
    // All rows must have required fields
    for (const row of rows) {
      expect(typeof row.executionId).toBe('string');
      expect(typeof row.toolName).toBe('string');
      expect(typeof row.status).toBe('string');
      expect(typeof row.conversationId).toBe('string');
      expect(typeof row.createdAt).toBe('string');
      // Must be parseable ISO-8601
      expect(isNaN(Date.parse(row.createdAt))).toBe(false);
      // Raw tool arguments must never appear
      expect((row as any).args).toBeUndefined();
      expect((row as any).arguments).toBeUndefined();
    }

    // Filter by status
    const completedRows = repository.exportToJson({ status: 'COMPLETED' });
    expect(completedRows).toHaveLength(2);
    expect(completedRows.every((r) => r.status === 'COMPLETED')).toBe(true);

    // Filter by conversationId
    const c1Rows = repository.exportToJson({ conversationId: 'c1' });
    expect(c1Rows).toHaveLength(3);
  });

  it('TASK-051: exportToCsv produces valid RFC-4180 CSV with correct header', () => {
    populateSampleData(repository);

    const csv = repository.exportToCsv();
    const lines = csv.split('\n');

    // First line is the header
    const header = lines[0].split(',');
    expect(header).toContain('executionId');
    expect(header).toContain('toolName');
    expect(header).toContain('status');
    expect(header).toContain('conversationId');
    expect(header).toContain('createdAt');
    expect(header).toContain('durationMs');
    expect(header).toContain('sequence');

    // Data rows follow
    expect(lines.length).toBe(6); // 1 header + 5 data rows

    // CSV must not contain any 'args' or 'arguments' column
    expect(header.includes('args')).toBe(false);
    expect(header.includes('arguments')).toBe(false);

    // Filtered CSV
    const filteredCsv = repository.exportToCsv({ conversationId: 'c2' });
    const filteredLines = filteredCsv.split('\n');
    expect(filteredLines.length).toBe(3); // 1 header + 2 c2 rows
  });

  it('TASK-052: filters by errorCode and approvalState in query, analytics, and exports', () => {
    populateSampleData(repository);

    // Filter by errorCode
    const errRes = repository.query({ errorCode: 'PERMISSION_DENIED' });
    expect(errRes.total).toBe(1);
    expect(errRes.items[0].executionId).toBe('e3');

    const errAnalytics = repository.computeAnalytics(repository.listAll(), { errorCode: 'PERMISSION_DENIED' });
    expect(errAnalytics.totalCount).toBe(1);
    expect(errAnalytics.failureCount).toBe(1);

    const errExport = repository.exportToJson({ errorCode: 'PERMISSION_DENIED' });
    expect(errExport).toHaveLength(1);
    expect(errExport[0].errorCode).toBe('PERMISSION_DENIED');

    // Filter by approvalState
    const requiredRes = repository.query({ approvalState: 'REQUIRED' });
    expect(requiredRes.total).toBe(2); // e4 (appr_4), e5 (appr_5)

    const waitingRes = repository.query({ approvalState: 'WAITING' });
    expect(waitingRes.total).toBe(1);
    expect(waitingRes.items[0].executionId).toBe('e5');

    const deniedRes = repository.query({ approvalState: 'DENIED' });
    expect(deniedRes.total).toBe(1);
    expect(deniedRes.items[0].executionId).toBe('e4');

    const noneRes = repository.query({ approvalState: 'NONE' });
    expect(noneRes.total).toBe(3); // e1, e2, e3
  });

  it('TASK-053: computeVisualization generates deterministic time-series bucketing', () => {
    populateSampleData(repository);

    const chartData = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 5000 }, 4);
    expect(chartData.fromTimestamp).toBe(1000);
    expect(chartData.toTimestamp).toBe(5000);
    expect(chartData.bucketSizeMs).toBe(1000);

    const completedSeries = chartData.series.find((s) => s.id === 'completed');
    const failedSeries = chartData.series.find((s) => s.id === 'failed');
    const avgLatencySeries = chartData.series.find((s) => s.id === 'avgLatency');

    expect(completedSeries).toBeDefined();
    expect(failedSeries).toBeDefined();
    expect(avgLatencySeries).toBeDefined();

    expect(completedSeries!.points).toHaveLength(4);
    expect(failedSeries!.points).toHaveLength(4);
    expect(avgLatencySeries!.points).toHaveLength(4);

    // e1 (createdAt: 1000, status: COMPLETED, duration: 50) -> Bucket 0
    expect(completedSeries!.points[0].value).toBe(1);
    expect(avgLatencySeries!.points[0].value).toBe(50);

    // e2 (createdAt: 2000, status: COMPLETED, duration: 100) -> Bucket 1
    expect(completedSeries!.points[1].value).toBe(1);
    expect(avgLatencySeries!.points[1].value).toBe(100);

    // e3 (createdAt: 3000, status: FAILED, duration: 20) -> Bucket 2
    expect(failedSeries!.points[2].value).toBe(1);
    expect(avgLatencySeries!.points[2].value).toBe(20);
  });
});
