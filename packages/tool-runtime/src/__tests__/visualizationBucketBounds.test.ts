import { describe, it, expect } from 'vitest';
import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';

describe('ToolExecutionRepository Visualization Bucket Bounds Suite', () => {
  it('1. safely defaults numBuckets when undefined, null, or NaN is passed', () => {
    const repo = new ToolExecutionRepository();

    repo.upsert({
      executionId: 'exec_01',
      requestId: 'req_01',
      conversationId: 'conv_01',
      toolCallId: 'tc_01',
      toolName: 'read_file',
      status: 'COMPLETED',
      createdAt: Date.now() - 1000,
      durationMs: 50,
    });

    const vizUndefined = repo.computeVisualization(Array.from((repo as any).records.values()), undefined, undefined);
    const totalSeriesUndef = vizUndefined.series.find((s) => s.id === 'total')!;
    expect(totalSeriesUndef.points.length).toBe(12);

    const vizNaN = repo.computeVisualization(Array.from((repo as any).records.values()), undefined, NaN);
    const totalSeriesNaN = vizNaN.series.find((s) => s.id === 'total')!;
    expect(totalSeriesNaN.points.length).toBe(12);
  });
});
