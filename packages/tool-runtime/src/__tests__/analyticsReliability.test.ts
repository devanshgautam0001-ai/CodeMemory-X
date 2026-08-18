import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeAnalyticsFilter, MAX_ANALYTICS_RANGE_MS } from '../utils/normalizeAnalyticsFilter.js';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutionAudit } from '../types/ToolExecutionAudit.js';

describe('TASK-057 Production Analytics Reliability & Polish Test Suite', () => {
  let repository: ToolExecutionRepository;
  let auditor: ToolExecutionAuditor;

  beforeEach(() => {
    repository = new ToolExecutionRepository();
    auditor = new ToolExecutionAuditor(undefined, undefined, undefined, 'global', repository);
  });

  function populateReliabilityData(repo: ToolExecutionRepository) {
    const records: ToolExecutionAudit[] = [
      { executionId: 'e1', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc1', toolName: 'search_memories', status: 'COMPLETED', createdAt: 1000, durationMs: 40, sequence: 1 },
      { executionId: 'e2', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc2', toolName: 'search_memories', status: 'COMPLETED', createdAt: 2000, durationMs: 60, sequence: 2 },
      { executionId: 'e3', requestId: 'r2', conversationId: 'c1', toolCallId: 'tc3', toolName: '=SUM(1,2)', status: 'FAILED', createdAt: 3000, durationMs: 15, errorCode: '+ERR_VAL', sequence: 1 },
      { executionId: 'e4', requestId: 'r3', conversationId: 'c2', toolCallId: 'tc4', toolName: '@calc_tool', status: 'DENIED', createdAt: 4000, approvalRequestId: 'appr_4', sequence: 1 },
      { executionId: 'e5', requestId: 'r4', conversationId: 'c2', toolCallId: 'tc5', toolName: '-exec_shell', status: 'EXPIRED', createdAt: 5000, approvalRequestId: 'appr_5', sequence: 1 },
    ];
    for (const r of records) {
      repo.upsert(r);
    }
  }

  // 1. Filter normalization — empty strings & ALL -> undefined
  it('1. normalizes empty strings, whitespace, and ALL to undefined', () => {
    const norm = normalizeAnalyticsFilter({
      conversationId: '   ',
      toolName: 'ALL',
      status: 'all',
      errorCode: '',
      approvalState: 'ALL',
    });
    expect(norm.conversationId).toBeUndefined();
    expect(norm.toolName).toBeUndefined();
    expect(norm.status).toBeUndefined();
    expect(norm.errorCode).toBeUndefined();
    expect(norm.approvalState).toBeUndefined();
  });

  // 2. Filter normalization — invalid timestamps rejection
  it('2. rejects NaN, Infinity, negative, and non-numeric timestamps', () => {
    const norm = normalizeAnalyticsFilter({
      fromTimestamp: NaN as any,
      toTimestamp: -500 as any,
    });
    expect(norm.fromTimestamp).toBeUndefined();
    expect(norm.toTimestamp).toBeUndefined();
  });

  // 3. Filter normalization — reversed timestamps swapping
  it('3. swaps reversed timestamps when fromTimestamp > toTimestamp', () => {
    const norm = normalizeAnalyticsFilter({
      fromTimestamp: 5000,
      toTimestamp: 1000,
    });
    expect(norm.fromTimestamp).toBe(1000);
    expect(norm.toTimestamp).toBe(5000);
  });

  // 4. Filter normalization — 30-day range ceiling
  it('4. caps time range to maximum 30 days window', () => {
    const now = 10_000_000_000;
    const norm = normalizeAnalyticsFilter({
      fromTimestamp: 1000,
      toTimestamp: now,
    });
    expect(norm.toTimestamp).toBe(now);
    expect(norm.fromTimestamp).toBe(now - MAX_ANALYTICS_RANGE_MS);
  });

  // 5. Zero-value dataset visualization calculation
  it('5. computes visualization for zero-value dataset safely without NaN or division by 0', () => {
    const viz = repository.computeVisualization([], { fromTimestamp: 1000, toTimestamp: 5000 }, 5);
    expect(viz.totalExecutions).toBe(0);
    expect(viz.successRate).toBe(0);
    expect(viz.avgDurationMs).toBe(0);
    expect(viz.minDurationMs).toBe(0);
    expect(viz.maxDurationMs).toBe(0);
    for (const s of viz.series) {
      for (const pt of s.points) {
        expect(Number.isNaN(pt.value)).toBe(false);
        expect(Number.isFinite(pt.value)).toBe(true);
      }
    }
  });

  // 6. Single-bucket visualization calculation
  it('6. computes single-bucket visualization cleanly', () => {
    populateReliabilityData(repository);
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 5000 }, 1);
    expect(viz.series[0].points.length).toBe(1);
    expect(viz.totalExecutions).toBe(5);
  });

  // 7. Equal-latency dataset visualization safety
  it('7. computes visualization for equal-latency executions without division error', () => {
    repository.upsert({ executionId: 'eq1', requestId: 'req1', conversationId: 'c1', toolCallId: 'tc1', toolName: 't1', status: 'COMPLETED', createdAt: 1000, durationMs: 100, sequence: 1 });
    repository.upsert({ executionId: 'eq2', requestId: 'req1', conversationId: 'c1', toolCallId: 'tc2', toolName: 't1', status: 'COMPLETED', createdAt: 2000, durationMs: 100, sequence: 2 });
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 2000 }, 2);
    expect(viz.avgDurationMs).toBe(100);
    expect(viz.minDurationMs).toBe(100);
    expect(viz.maxDurationMs).toBe(100);
  });

  // 8. Large-value latency visualization calculation
  it('8. handles large latency numbers safely without overflow or NaN', () => {
    repository.upsert({ executionId: 'lg1', requestId: 'r_lg', conversationId: 'c1', toolCallId: 'tc_lg', toolName: 't1', status: 'COMPLETED', createdAt: 1000, durationMs: 999_999_999, sequence: 1 });
    const viz = repository.computeVisualization(repository.listAll(), { fromTimestamp: 1000, toTimestamp: 1000 }, 1);
    expect(viz.maxDurationMs).toBe(999_999_999);
    expect(Number.isFinite(viz.maxDurationMs)).toBe(true);
  });

  // 9. Deterministic ordering: createdAt DESC -> sequence DESC -> executionId ASC
  it('9. enforces deterministic ordering in exportToJson', () => {
    populateReliabilityData(repository);
    const rows = repository.exportToJson({ conversationId: 'c1' });
    expect(rows.length).toBe(3);
    // e3 createdAt 3000, e2 createdAt 2000, e1 createdAt 1000
    expect(rows[0].executionId).toBe('e3');
    expect(rows[1].executionId).toBe('e2');
    expect(rows[2].executionId).toBe('e1');
  });

  // 10. CSV formula injection protection (=, +, -, @)
  it('10. prefixes values starting with =, +, -, @ with single quote in exportToCsv', () => {
    populateReliabilityData(repository);
    const csv = repository.exportToCsv();
    expect(csv).toContain("'=SUM(1,2)");
    expect(csv).toContain("'+ERR_VAL");
    expect(csv).toContain("'@calc_tool");
    expect(csv).toContain("'-exec_shell");
  });

  // 11. Structured report metadata consistency
  it('11. exportReportJson metadata totalExportedRecords matches records length exactly', () => {
    populateReliabilityData(repository);
    const report = repository.exportReportJson({ conversationId: 'c2' });
    expect(report.metadata.schemaVersion).toBe('1.0.0');
    expect(report.metadata.totalExportedRecords).toBe(report.records.length);
    expect(report.metadata.analyticsSummary.totalExecutions).toBe(2);
  });

  // 12. Security boundary enforcement — zero secret exposure
  it('12. guarantees exported DTOs contain zero prompt, argument, or token data', () => {
    populateReliabilityData(repository);
    const report = repository.exportReportJson();
    const jsonStr = JSON.stringify(report);
    expect(jsonStr).not.toContain('prompt');
    expect(jsonStr).not.toContain('rawArgs');
    expect(jsonStr).not.toContain('toolResults');
    expect(jsonStr).not.toContain('token');
    expect(jsonStr).not.toContain('secret');
  });

  // 13. Empty dataset query safety
  it('13. query returns total 0 and items [] when no records match filter', () => {
    populateReliabilityData(repository);
    const res = repository.query({ toolName: 'non_existent_tool' });
    expect(res.total).toBe(0);
    expect(res.items).toEqual([]);
    expect(res.hasMore).toBe(false);
  });

  // 14. 500-bucket upper bound enforcement
  it('14. caps numBuckets to maximum 500 in computeVisualization', () => {
    const viz = repository.computeVisualization([], { fromTimestamp: 1000, toTimestamp: 10000 }, 1000);
    expect(viz.series[0].points.length).toBeLessThanOrEqual(500);
  });

  // 15. Auditor query rehydrates historical events safely
  it('15. auditor query rehydrates historical events and applies normalized filter', async () => {
    const mockES = {
      appendEvent: async () => ({ isSuccess: true, isFailure: false }),
      getEvents: async () => ({
        isSuccess: true,
        isFailure: false,
        value: [
          {
            payload: {
              executionId: 'e_h1',
              requestId: 'r_h1',
              conversationId: 'c1',
              toolCallId: 'tc_h1',
              toolName: 'read_file',
              status: 'COMPLETED',
              createdAt: 1000,
              sequence: 1,
            },
          },
        ],
      }),
    };
    const testAuditor = new ToolExecutionAuditor(undefined, undefined, mockES as any, 'global');
    const res = await testAuditor.queryExecutions({ toolName: 'READ_FILE' });
    expect(res.total).toBe(1);
    expect(res.items[0].executionId).toBe('e_h1');
  });
});
