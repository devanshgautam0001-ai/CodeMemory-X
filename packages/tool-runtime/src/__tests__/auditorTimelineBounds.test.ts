import { describe, it, expect } from 'vitest';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';

describe('ToolExecutionAuditor Timeline Query Limit Suite', () => {
  it('1. returns empty array when limit is 0', () => {
    const auditor = new ToolExecutionAuditor();
    auditor.recordRequested({ executionId: 'exec_01', requestId: 'req_01', conversationId: 'conv_01', toolCallId: 'tc_01', toolName: 'read_file' });

    const timeline = auditor.getTimeline('conv_01', 0);
    expect(timeline).toEqual([]);
  });

  it('2. handles negative or NaN limit parameter values safely', () => {
    const auditor = new ToolExecutionAuditor();
    auditor.recordRequested({ executionId: 'exec_02', requestId: 'req_02', conversationId: 'conv_02', toolCallId: 'tc_02', toolName: 'read_file' });

    const timelineNeg = auditor.getTimeline('conv_02', -10);
    expect(timelineNeg.length).toBe(0);

    const timelineNaN = auditor.getTimeline('conv_02', NaN);
    expect(timelineNaN.length).toBe(1);
  });
});
