import { describe, it, expect } from 'vitest';
import { ToolCallOrchestrator } from '../orchestration/ToolCallOrchestrator.js';

describe('ToolCallOrchestrator Abort Check Suite', () => {
  it('1. returns failure immediately when parentContext signal is aborted', async () => {
    const mockProvider = {
      id: 'mock',
      defaultModel: 'mock-model',
      generate: async () => {
        throw new Error('Should not be called when aborted');
      },
    };

    const mockExecutor = {} as any;
    const orchestrator = new ToolCallOrchestrator(mockProvider as any, mockExecutor);

    const controller = new AbortController();
    controller.abort();

    const result = await orchestrator.orchestrate(
      { messages: [{ role: 'user', content: 'test' }] },
      { signal: controller.signal }
    );

    expect(result.isFailure).toBe(true);
    expect(result.error?.message).toContain('cancelled by caller signal');
  });
});
