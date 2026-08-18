import { describe, it, expect, vi } from 'vitest';
import { AgentLoopController } from '../orchestration/AgentLoopController.js';
import { IAIProvider } from '@codememory/ai-provider';
import { ok } from '@codememory/shared';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { ToolCallOrchestrator } from '../orchestration/ToolCallOrchestrator.js';

describe('AgentLoopLimits Unit Tests', () => {
  it('enforces maxIterations safety limit and terminates infinite loops', async () => {
    const controller = new AgentLoopController({ maxIterations: 2 });
    controller.incrementIteration();
    controller.incrementIteration();

    expect(() => controller.incrementIteration()).toThrow('ORCHESTRATION_LIMIT');
  });

  it('enforces maxToolCalls limit and terminates when tool count is exceeded', async () => {
    const controller = new AgentLoopController({ maxToolCalls: 5 });
    controller.incrementToolCalls(3);
    expect(() => controller.incrementToolCalls(3)).toThrow('ORCHESTRATION_LIMIT');
  });

  it('orchestrator returns ORCHESTRATION_LIMIT error when maxIterations is exceeded', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'loop_tool',
      parameters: {},
      execute: async () => ({ success: true, content: 'looping' }),
    });

    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: true, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: true, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn().mockResolvedValue(
        ok({
          id: 'res_loop',
          model: 'm',
          content: '',
          toolCalls: [{ id: 'tc1', name: 'loop_tool', arguments: {} }],
          finishReason: 'tool_calls',
        })
      ),
      generateStream: vi.fn() as any,
    };

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );

    const orchestrator = new ToolCallOrchestrator(mockProvider, executor, { maxIterations: 3 });

    const res = await orchestrator.orchestrate({
      messages: [{ role: 'user', content: 'infinite' }],
    });

    expect(res.isFailure).toBe(true);
    if (res.isFailure) {
      expect((res.error as any).code).toBe('ORCHESTRATION_LIMIT');
    }
  });
});
