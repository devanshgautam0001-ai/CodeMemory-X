import { describe, it, expect } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAudit } from '../types/ToolExecutionAudit.js';

describe('TASK-059 Security Boundary Audit & Zero-Secret Exposure Suite', () => {
  it('1. exportToJson scrubbed rows contain zero arguments, results, prompts, or secrets', () => {
    const repo = new ToolExecutionRepository();
    const auditRecord: ToolExecutionAudit = {
      executionId: 'e_sec_1',
      requestId: 'r_sec_1',
      conversationId: 'conv_1',
      toolCallId: 'tc_1',
      toolName: 'read_file',
      status: 'COMPLETED',
      createdAt: Date.now(),
      durationMs: 50,
      sequence: 1,
    };
    repo.upsert(auditRecord);

    const rows = repo.exportToJson();
    expect(rows.length).toBe(1);

    const rowStr = JSON.stringify(rows[0]);
    expect(rowStr).not.toContain('prompt');
    expect(rowStr).not.toContain('rawArgs');
    expect(rowStr).not.toContain('toolResults');
    expect(rowStr).not.toContain('apiKey');
    expect(rowStr).not.toContain('bearer');
    expect(rowStr).not.toContain('password');
  });

  it('2. exportToCsv cell values starting with =, +, -, @ are escaped to prevent CSV formula injection', () => {
    const repo = new ToolExecutionRepository();
    repo.upsert({
      executionId: 'e_sec_2',
      requestId: 'r_sec_2',
      conversationId: 'c1',
      toolCallId: 'tc_2',
      toolName: '=cmd|calc',
      status: 'FAILED',
      createdAt: Date.now(),
      errorCode: '+CRITICAL_ERR',
      durationMs: 10,
      sequence: 1,
    });

    const csv = repo.exportToCsv();
    // Formula injection: escapeCell prepends ' for cells starting with =, +, -, @
    expect(csv).toContain("'=cmd|calc");
    expect(csv).toContain("'+CRITICAL_ERR");
    // Ensure original dangerous string is NOT present as-is at the start of a cell
    expect(csv).not.toMatch(/(^|,)=cmd\|calc/m);
    expect(csv).not.toMatch(/(^|,)\+CRITICAL_ERR/m);
  });

  it('3. exportReportJson metadata contains zero absolute workspace filesystem paths or secret tokens', () => {
    const repo = new ToolExecutionRepository();
    repo.upsert({
      executionId: 'e_sec_3',
      requestId: 'r_sec_3',
      conversationId: 'c1',
      toolCallId: 'tc_3',
      toolName: 'search_memories',
      status: 'COMPLETED',
      createdAt: Date.now(),
      durationMs: 15,
      sequence: 1,
    });

    const report = repo.exportReportJson();
    const str = JSON.stringify(report);

    expect(str).not.toContain('c:\\Users\\devan_fetqj2p'); // No local absolute path
    expect(str).not.toContain('C:/Users');
    expect(str).not.toContain('sk-');
    expect(str).not.toContain('token');
  });
});
