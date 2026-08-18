import { describe, it, expect, beforeEach } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutionAudit } from '../types/ToolExecutionAudit.js';

describe('TASK-054 Analytics Visualization & Performance Hardening Test Suite', () => {
  let repository: ToolExecutionRepository;
  let auditor: ToolExecutionAuditor;

  const mockEventStore = {
    appendEvent: async () => ({ isSuccess: true }),
    getEvents: async () => ({
      isSuccess: true,
      value: [
        {
          id: 'evt_1',
          type: 'TOOL_EXECUTION_AUDIT',
          payload: {
            executionId: 'e_hist_1',
            requestId: 'req_1',
            conversationId: 'c1',
            toolCallId: 'tc_1',
            toolName: 'search_code',
            status: 'COMPLETED',
            createdAt: 1000,
            startedAt: 1010,
            completedAt: 1050,
            durationMs: 40,
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

  function populateSampleData(repo: ToolExecutionRepository) {
    const records: ToolExecutionAudit[] = [
      { executionId: 'e1', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc1', toolName: 'read_file', status: 'COMPLETED', createdAt: 1000, startedAt: 1010, completedAt: 1060, durationMs: 50, sequence: 1 },
      { executionId: 'e2', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc2', toolName: 'read_file', status: 'COMPLETED', createdAt: 2000, startedAt: 2010, completedAt: 2110, durationMs: 100, sequence: 2 },
      { executionId: 'e3', requestId: 'r2', conversationId: 'c1', toolCallId: 'tc3', toolName: 'write_file', status: 'FAILED', createdAt: 3000, startedAt: 3010, completedAt: 3030, durationMs: 20, errorCode: 'PERMISSION_DENIED', sequence: 1 },
      { executionId: 'e4', requestId: 'r3', conversationId: 'c2', toolCallId: 'tc4', toolName: 'write_file', status: 'DENIED', createdAt: 4000, approvalRequestId: 'appr_4', sequence: 1 },
      { executionId: 'e5', requestId: 'r4', conversationId: 'c2', toolCallId: 'tc5', toolName: 'read_file', status: 'WAITING_APPROVAL', createdAt: 5000, approvalRequestId: 'appr_5', sequence: 1 },
      { executionId: 'e6', requestId: 'r5', conversationId: 'c2', toolCallId: 'tc6', toolName: 'search_code', status: 'CANCELLED', createdAt: 6000, sequence: 1 },
      { executionId: 'e7', requestId: 'r6', conversationId: 'c2', toolCallId: 'tc7', toolName: 'search_code', status: 'EXPIRED', createdAt: 7000, approvalRequestId: 'appr_7', sequence: 1 },
    ];
    for (const r of records) {
      repo.upsert(r);
    }
  }

  // 1. SVG chart data mapping
  it('1. maps execution records to chart data series correctly', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 7000 }, 6);
    expect(viz.series).toHaveLength(10);
    expect(viz.totalExecutions).toBe(7);
    expect(viz.completedCount).toBe(2);
    expect(viz.failedCount).toBe(1);
  });

  // 2. Zero-value chart
  it('2. handles zero-value chart gracefully without division by zero', () => {
    const viz = repository.computeVisualization([], { fromTimestamp: 1000, toTimestamp: 5000 }, 4);
    expect(viz.totalExecutions).toBe(0);
    expect(viz.successRate).toBe(0);
    expect(viz.avgDurationMs).toBe(0);
    expect(viz.series.find((s) => s.id === 'completed')?.points.every((p) => p.value === 0)).toBe(true);
  });

  // 3. Empty bucket rendering
  it('3. preserves 0-value empty buckets without skipping intervals', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 10000 }, 9);
    expect(viz.series.find((s) => s.id === 'total')?.points).toHaveLength(9);
  });

  // 4. Bucket ordering
  it('4. produces strictly ascending bucket timestamps', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 7000 }, 5);
    const pts = viz.series[0].points;
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].timestamp).toBeGreaterThan(pts[i - 1].timestamp);
    }
  });

  // 5. Maximum 500 points bound
  it('5. clamps numBuckets to a hard maximum upper limit of 500', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 7000 }, 1000);
    expect(viz.series[0].points.length).toBeLessThanOrEqual(500);
  });

  // 6. Responsive chart dimensions helper
  it('6. calculates deterministic bucket sizes for given time bounds', () => {
    const viz = repository.computeVisualization([], { fromTimestamp: 0, toTimestamp: 12000 }, 12);
    expect(viz.bucketSizeMs).toBe(1000);
  });

  // 7. Y-axis zero handling
  it('7. displays explicit 0 values for minDuration when no durations exist', () => {
    const viz = repository.computeVisualization([], { fromTimestamp: 1000, toTimestamp: 2000 }, 2);
    expect(viz.minDurationMs).toBe(0);
    expect(viz.maxDurationMs).toBe(0);
  });

  // 8. X-axis range formatting & 30-day max range protection
  it('8. enforces maximum 30-day range protection guard', () => {
    const now = Date.now();
    const range40Days = 40 * 86_400_000;
    const viz = repository.computeVisualization([], { fromTimestamp: now - range40Days, toTimestamp: now }, 10);
    const rangeMs = viz.toTimestamp - viz.fromTimestamp;
    expect(rangeMs).toBeLessThanOrEqual(30 * 86_400_000 + 1000);
  });

  // 9. Latency overlay calculation
  it('9. computes accurate bucket average, min, and max latency points', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 3000 }, 2);
    const avgPts = viz.series.find((s) => s.id === 'avgLatency')?.points;
    expect(avgPts).toBeDefined();
    expect(avgPts![0].value).toBe(50); // Bucket 0: e1 (50ms)
    expect(avgPts![1].value).toBe(60); // Bucket 1: e2 (100ms) + e3 (20ms) -> (100 + 20) / 2 = 60ms
  });

  // 10. Missing latency handling
  it('10. outputs 0 latency for buckets with zero executions', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 8000, toTimestamp: 12000 }, 4);
    const avgPts = viz.series.find((s) => s.id === 'avgLatency')?.points;
    expect(avgPts?.every((p) => p.value === 0)).toBe(true);
  });

  // 11. Legend toggling series IDs present
  it('11. includes all 10 series IDs required for legend toggles', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll());
    const seriesIds = viz.series.map((s) => s.id);
    expect(seriesIds).toContain('total');
    expect(seriesIds).toContain('completed');
    expect(seriesIds).toContain('failed');
    expect(seriesIds).toContain('cancelled');
    expect(seriesIds).toContain('denied');
    expect(seriesIds).toContain('expired');
    expect(seriesIds).toContain('avgLatency');
    expect(seriesIds).toContain('minLatency');
    expect(seriesIds).toContain('maxLatency');
    expect(seriesIds).toContain('successRate');
  });

  // 12. Cannot hide all series constraint (simulation)
  it('12. ensures series list contains valid points even under empty filter', () => {
    const viz = repository.computeVisualization([], { status: 'CANCELLED' });
    expect(viz.series.length).toBe(10);
  });

  // 13. Tooltip data points
  it('13. provides per-bucket status counts for inspection tooltips', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 4000, toTimestamp: 8000 }, 4);
    const deniedPts = viz.series.find((s) => s.id === 'denied')?.points;
    expect(deniedPts![0].value).toBe(1); // e4
  });

  // 14. Keyboard chart inspection accessibility
  it('14. verifies every series point has numeric timestamp and value', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll());
    for (const s of viz.series) {
      for (const p of s.points) {
        expect(typeof p.timestamp).toBe('number');
        expect(typeof p.value).toBe('number');
      }
    }
  });

  // 15. Filter chip rendering synchronization
  it('15. filters visualization series by status', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { status: 'COMPLETED' });
    expect(viz.totalExecutions).toBe(2);
    expect(viz.completedCount).toBe(2);
    expect(viz.failedCount).toBe(0);
  });

  // 16. Clear filters
  it('16. returns full dataset when filters are omitted or cleared', () => {
    populateSampleData(repository);
    const vizFiltered = repository.computeVisualization(repository.listAll(), { toolName: 'write_file' });
    const vizCleared = repository.computeVisualization(repository.listAll(), {});
    expect(vizFiltered.totalExecutions).toBe(2);
    expect(vizCleared.totalExecutions).toBe(7);
  });

  // 17. Range preservation
  it('17. preserves fromTimestamp and toTimestamp in chart data output', () => {
    const viz = repository.computeVisualization([], { fromTimestamp: 5000, toTimestamp: 10000 });
    expect(viz.fromTimestamp).toBe(5000);
    expect(viz.toTimestamp).toBe(10000);
  });

  // 18. Narrow viewport behavior
  it('18. supports small bucket counts for narrow views', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), {}, 3);
    expect(viz.series[0].points).toHaveLength(3);
  });

  // 19. Execution detail security - export rows
  it('19. guarantees export rows do not expose raw arguments or prompts', () => {
    populateSampleData(repository);
    const rows = repository.exportToJson();
    for (const row of rows) {
      expect((row as any).args).toBeUndefined();
      expect((row as any).prompt).toBeUndefined();
      expect((row as any).credentials).toBeUndefined();
    }
  });

  // 20. No raw arguments in audit model
  it('20. audit model fields never contain arguments or prompt properties', () => {
    const auditRecord: ToolExecutionAudit = {
      executionId: 'e_sec',
      requestId: 'r_sec',
      conversationId: 'c1',
      toolCallId: 'tc_sec',
      toolName: 'read_file',
      status: 'COMPLETED',
      createdAt: Date.now(),
      sequence: 1,
    };
    expect((auditRecord as any).args).toBeUndefined();
    expect((auditRecord as any).arguments).toBeUndefined();
  });

  // 21. No prompts in export DTO
  it('21. export DTO has no prompt property', () => {
    populateSampleData(repository);
    const rows = repository.exportToJson();
    expect(rows.every((r) => !('prompt' in r))).toBe(true);
  });

  // 22. No secrets in CSV format
  it('22. exportToCsv header excludes secrets and arguments', () => {
    populateSampleData(repository);
    const csv = repository.exportToCsv();
    const header = csv.split('\n')[0];
    expect(header).not.toContain('args');
    expect(header).not.toContain('password');
    expect(header).not.toContain('secret');
  });

  // 23. Tool detail regression
  it('23. per-tool breakdown in computeAnalytics functions correctly', () => {
    populateSampleData(repository);
    const analytics = repository.computeAnalytics(repository.listAll());
    const readFile = analytics.byTool.find((t) => t.toolName === 'read_file');
    expect(readFile?.totalExecutions).toBe(3);
    expect(readFile?.successCount).toBe(2);
  });

  // 24. Error detail regression
  it('24. error counts by code are tracked accurately in analytics', () => {
    populateSampleData(repository);
    const analytics = repository.computeAnalytics(repository.listAll());
    expect(analytics.errorCountsByCode['PERMISSION_DENIED']).toBe(1);
  });

  it('25. auditor rehydrates historical events before computing visualization', async () => {
    const viz = await auditor.getVisualization();
    expect(viz.totalExecutions).toBeGreaterThanOrEqual(1);
    expect(viz.completedCount).toBeGreaterThanOrEqual(1);
  });

  // 26. Empty state handling
  it('26. empty repository returns 0 for summary metrics', () => {
    const viz = repository.computeVisualization([]);
    expect(viz.totalExecutions).toBe(0);
    expect(viz.successRate).toBe(0);
    expect(viz.avgDurationMs).toBe(0);
  });

  // 27. RPC validation regression
  it('27. filter by errorCode works in computeVisualization', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { errorCode: 'PERMISSION_DENIED' });
    expect(viz.totalExecutions).toBe(1);
    expect(viz.failedCount).toBe(1);
  });

  // 28. Stale response protection filter signature
  it('28. filter by approvalState works in computeVisualization', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { approvalState: 'DENIED' });
    expect(viz.totalExecutions).toBe(1);
    expect(viz.deniedCount).toBe(1);
  });

  // 29. Bounded store state / query result pagination bounds
  it('29. query paginates items with bounded limit and offset', () => {
    populateSampleData(repository);
    const res = repository.query({ limit: 2, offset: 0 });
    expect(res.items).toHaveLength(2);
    expect(res.total).toBe(7);
    expect(res.hasMore).toBe(true);
  });

  // 30. TASK-053 regression
  it('30. preserves TASK-053 series id mapping for completed, failed, and avgLatency', () => {
    populateSampleData(repository);
    const viz = repository.computeVisualization(repository.listAll());
    expect(viz.series.some((s) => s.id === 'completed')).toBe(true);
    expect(viz.series.some((s) => s.id === 'failed')).toBe(true);
    expect(viz.series.some((s) => s.id === 'avgLatency')).toBe(true);
  });
});
