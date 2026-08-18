import { describe, it, expect } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';

describe('ToolExecutionRepository CSV Control & Formula Injection Suite', () => {
  it('1. escapes leading =, +, -, @, \\t, and \\r in CSV export cells', () => {
    const repo = new ToolExecutionRepository();

    repo.upsert({
      executionId: '=CMD("calc")',
      requestId: 'req_01',
      conversationId: '+SUM(1,2)',
      toolCallId: 'tc_01',
      toolName: '@SUM(1)',
      status: 'COMPLETED',
      createdAt: Date.now(),
      errorCode: '\tDANGEROUS',
    });

    const csv = repo.exportToCsv();
    const lines = csv.split('\n');

    expect(lines.length).toBeGreaterThan(1);
    const dataLine = lines[1];

    // Leading formula/control characters should be escaped with leading single quote
    expect(dataLine).toContain("'=CMD");
    expect(dataLine).toContain("'+SUM");
    expect(dataLine).toContain("'@SUM");
    expect(dataLine).toContain("'\tDANGEROUS");
  });
});
