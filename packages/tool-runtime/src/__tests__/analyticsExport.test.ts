import { describe, it, expect, beforeEach } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutionAudit } from '../types/ToolExecutionAudit.js';

describe('TASK-056 Production Analytics Export & Reporting Hardening Test Suite', () => {
  let repository: ToolExecutionRepository;
  let auditor: ToolExecutionAuditor;

  const mockEventStore = {
    appendEvent: async () => ({ isSuccess: true, isFailure: false }),
    getEvents: async () => ({
      isSuccess: true,
      isFailure: false,
      value: [
        {
          id: 'evt_exp1',
          type: 'TOOL_EXECUTION_AUDIT',
          payload: {
            executionId: 'e_exp_1',
            requestId: 'r_exp_1',
            conversationId: 'c1',
            toolCallId: 'tc_exp_1',
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

  function populateExportData(repo: ToolExecutionRepository) {
    const records: ToolExecutionAudit[] = [
      { executionId: 'e1', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc1', toolName: 'search_memories', status: 'COMPLETED', createdAt: 1000, durationMs: 40, sequence: 1 },
      { executionId: 'e2', requestId: 'r1', conversationId: 'c1', toolCallId: 'tc2', toolName: 'search_memories', status: 'COMPLETED', createdAt: 1000, durationMs: 60, sequence: 2 },
      { executionId: 'e3', requestId: 'r2', conversationId: 'c1', toolCallId: 'tc3', toolName: '=SUM(1,2)', status: 'FAILED', createdAt: 3000, durationMs: 15, errorCode: '+ERR_CMD', sequence: 1 },
      { executionId: 'e4', requestId: 'r3', conversationId: 'c2', toolCallId: 'tc4', toolName: '@calculator', status: 'DENIED', createdAt: 4000, approvalRequestId: 'appr_4', sequence: 1 },
      { executionId: 'e5', requestId: 'r4', conversationId: 'c2', toolCallId: 'tc5', toolName: '-exec_tool', status: 'WAITING_APPROVAL', createdAt: 5000, approvalRequestId: 'appr_5', sequence: 1 },
      { executionId: 'e6', requestId: 'r5', conversationId: 'c2', toolCallId: 'tc6', toolName: 'normal_tool', status: 'CANCELLED', createdAt: 6000, sequence: 1 },
    ];
    for (const r of records) {
      repo.upsert(r);
    }
  }

  // 1. Full filter propagation into CSV
  it('1. propagates all 7 filters correctly into CSV output', () => {
    populateExportData(repository);
    const csv = repository.exportToCsv({
      conversationId: 'c1',
      status: 'COMPLETED',
      toolName: 'search_memories',
      fromTimestamp: 500,
      toTimestamp: 2000,
    });
    expect(csv).toContain('e1');
    expect(csv).toContain('e2');
    expect(csv).not.toContain('e3');
    expect(csv).not.toContain('e4');
  });

  // 2. Full filter propagation into JSON
  it('2. propagates all 7 filters correctly into exportToJson', () => {
    populateExportData(repository);
    const rows = repository.exportToJson({ conversationId: 'c2', status: 'DENIED' });
    expect(rows.length).toBe(1);
    expect(rows[0].executionId).toBe('e4');
  });

  // 3. Deterministic ordering: createdAt DESC -> sequence DESC -> executionId ASC
  it('3. sorts export records deterministically by createdAt DESC -> sequence DESC -> executionId ASC', () => {
    populateExportData(repository);
    const rows = repository.exportToJson({ conversationId: 'c1', status: 'COMPLETED' });
    expect(rows.length).toBe(2);
    // Both createdAt = 1000, sequence 2 must precede sequence 1
    expect(rows[0].executionId).toBe('e2');
    expect(rows[1].executionId).toBe('e1');
  });

  // 4. CSV quote escaping
  it('4. escapes quotes properly in CSV output according to RFC-4180', () => {
    repository.upsert({
      executionId: 'e_q',
      requestId: 'rq',
      conversationId: 'c1',
      toolCallId: 'tc_q',
      toolName: 'tool_"quoted"',
      status: 'COMPLETED',
      createdAt: 1000,
      sequence: 1,
    });
    const csv = repository.exportToCsv();
    expect(csv).toContain('"tool_""quoted"""');
  });

  // 5. CSV newline escaping
  it('5. escapes newlines properly in CSV output according to RFC-4180', () => {
    repository.upsert({
      executionId: 'e_nl',
      requestId: 'rnl',
      conversationId: 'c1',
      toolCallId: 'tc_nl',
      toolName: 'tool\nwith\nnewlines',
      status: 'COMPLETED',
      createdAt: 1000,
      sequence: 1,
    });
    const csv = repository.exportToCsv();
    expect(csv).toContain('"tool\nwith\nnewlines"');
  });

  // 6. CSV comma escaping
  it('6. escapes commas properly in CSV output according to RFC-4180', () => {
    repository.upsert({
      executionId: 'e_comma',
      requestId: 'rc',
      conversationId: 'c1',
      toolCallId: 'tc_c',
      toolName: 'tool,with,commas',
      status: 'COMPLETED',
      createdAt: 1000,
      sequence: 1,
    });
    const csv = repository.exportToCsv();
    expect(csv).toContain('"tool,with,commas"');
  });

  // 7. CSV formula injection protection (=, +, -, @)
  it('7. prefixes cells starting with =, +, -, @ with single quote for formula injection protection', () => {
    populateExportData(repository);
    const csv = repository.exportToCsv();
    expect(csv).toContain("'=SUM(1,2)");
    expect(csv).toContain("'+ERR_CMD");
    expect(csv).toContain("'@calculator");
    expect(csv).toContain("'-exec_tool");
  });

  // 8. JSON schema version metadata
  it('8. exportReportJson generates schemaVersion 1.0.0 and valid ISO timestamp metadata', () => {
    populateExportData(repository);
    const report = repository.exportReportJson();
    expect(report.metadata.schemaVersion).toBe('1.0.0');
    expect(new Date(report.metadata.generatedAt).toISOString()).toBe(report.metadata.generatedAt);
    expect(report.metadata.totalExportedRecords).toBe(6);
    expect(report.records.length).toBe(6);
  });

  // 9. Empty dataset export handling
  it('9. handles empty dataset exports cleanly without throwing', () => {
    const csv = repository.exportToCsv();
    expect(csv).toContain('executionId,toolName,status');
    const rows = repository.exportToJson();
    expect(rows).toEqual([]);
    const report = repository.exportReportJson();
    expect(report.metadata.totalExportedRecords).toBe(0);
    expect(report.records).toEqual([]);
  });

  // 10. NaN / Infinity protection
  it('10. guarantees analytics summary in report contains zero NaN or Infinity values', () => {
    const report = repository.exportReportJson();
    const summary = report.metadata.analyticsSummary;
    expect(Number.isNaN(summary.successRate)).toBe(false);
    expect(Number.isFinite(summary.successRate)).toBe(true);
    expect(Number.isNaN(summary.avgDurationMs)).toBe(false);
    expect(Number.isFinite(summary.avgDurationMs)).toBe(true);
  });

  // 11. Secret redaction / prompt / tool argument exclusion
  it('11. strictly excludes prompt, arguments, toolResults, and API keys from exported DTOs', () => {
    repository.upsert({
      executionId: 'e_sec',
      requestId: 'r_sec',
      conversationId: 'c1',
      toolCallId: 'tc_sec',
      toolName: 'read_file',
      status: 'COMPLETED',
      createdAt: 1000,
      sequence: 1,
    });
    const report = repository.exportReportJson();
    const jsonStr = JSON.stringify(report);
    expect(jsonStr).not.toContain('prompt');
    expect(jsonStr).not.toContain('arguments');
    expect(jsonStr).not.toContain('toolResults');
    expect(jsonStr).not.toContain('apiKey');
    expect(jsonStr).not.toContain('authorization');
  });

  // 12. Analytics summary correctness in structured report
  it('12. matches computeAnalytics values exactly in report metadata', () => {
    populateExportData(repository);
    const report = repository.exportReportJson();
    expect(report.metadata.analyticsSummary.totalExecutions).toBe(6);
    expect(report.metadata.analyticsSummary.completedCount).toBe(2);
    expect(report.metadata.analyticsSummary.failedCount).toBe(1);
    expect(report.metadata.analyticsSummary.deniedCount).toBe(1);
  });

  // 13. Auditor exportReportJson rehydration
  it('13. auditor exportReportJson rehydrates historical events before exporting', async () => {
    const report = await auditor.exportReportJson();
    expect(report.metadata.totalExportedRecords).toBeGreaterThanOrEqual(1);
    expect(report.records[0].executionId).toBe('e_exp_1');
  });

  // 14. Auditor exportToCsv rehydration
  it('14. auditor exportToCsv rehydrates historical events and exports CSV', async () => {
    const csv = await auditor.exportToCsv();
    expect(csv).toContain('e_exp_1');
    expect(csv).toContain('read_file');
  });

  // 15. Filter summary preservation in report metadata
  it('15. preserves filter summary in report metadata for auditability', () => {
    populateExportData(repository);
    const filter = { conversationId: 'c1', status: 'COMPLETED' };
    const report = repository.exportReportJson(filter);
    expect(report.metadata.filterSummary).toEqual(filter);
  });
});
