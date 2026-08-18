import { describe, it, expect, vi } from 'vitest';
import { PipelineExecutor } from '../executor/PipelineExecutor.js';
import { PipelineContext } from '../context/PipelineContext.js';
import { PipelineStage } from '../ports/PipelineStage.js';
import { ok, fail } from '@codememory/shared';

describe('PipelineExecutor Unit Tests', () => {
  it('should execute stages sequentially in order', async () => {
    const order: string[] = [];

    const stage1: PipelineStage = {
      stageName: 'Stage1',
      execute: async (ctx) => {
        order.push('Stage1');
        return ok(ctx);
      },
    };

    const stage2: PipelineStage = {
      stageName: 'Stage2',
      execute: async (ctx) => {
        order.push('Stage2');
        return ok(ctx);
      },
    };

    const executor = new PipelineExecutor([stage1, stage2]);
    const ctx = new PipelineContext({ workspacePath: '/test/path' });

    const result = await executor.run(ctx);

    expect(result.isSuccess).toBe(true);
    expect(order).toEqual(['Stage1', 'Stage2']);
  });

  it('should halt execution and return failure when a stage fails', async () => {
    const stage1: PipelineStage = {
      stageName: 'FailingStage',
      execute: async () => fail(new Error('Stage 1 error')),
    };

    const stage2: PipelineStage = {
      stageName: 'UnreachedStage',
      execute: async (ctx) => ok(ctx),
    };

    const executor = new PipelineExecutor([stage1, stage2]);
    const result = await executor.run(new PipelineContext());

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Stage 1 error');
    }
  });
});
