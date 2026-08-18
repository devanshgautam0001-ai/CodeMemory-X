import { describe, it, expect, vi } from 'vitest';
import { ToolCallOrchestrator } from '../orchestration/ToolCallOrchestrator.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ok } from '@codememory/shared';

describe('ToolCallOrchestrator Signal Propagation Suite', () => {
  it('1. propagates parentContext.signal to generate request options', async () => {
    const controller = new AbortController();

    const mockProvider = {
      name: 'mock',
      models: ['mock-model'],
      capabilities: [],
      generate: vi.fn().mockImplementation(async (req) => {
        expect(req.signal).toBe(controller.signal);
        return ok({
          id: 'res_01',
          model: 'mock-model',
          content: 'Response text',
          finishReason: 'stop',
        });
      }),
      stream: vi.fn(),
    } as any;

    const registry = new ToolRegistry();
    const permissionManager = new ToolPermissionManager({ defaultPermission: 'ALLOW' });
    const auditor = new ToolExecutionAuditor();
    const executor = new ToolExecutor(registry, permissionManager, auditor);

    const orchestrator = new ToolCallOrchestrator(mockProvider, executor);

    const result = await orchestrator.orchestrate(
      {
        prompt: 'Test prompt',
        messages: [{ role: 'user', content: 'Test prompt' }],
      },
      {
        requestId: 'req_signal_01',
        signal: controller.signal,
      }
    );

    expect(result.isSuccess).toBe(true);
    expect(mockProvider.generate).toHaveBeenCalled();
  });
});
