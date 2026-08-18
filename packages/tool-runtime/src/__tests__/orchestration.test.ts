import { describe, it, expect, vi } from 'vitest';
import { IAIProvider } from '@codememory/ai-provider';
import { ok, fail } from '@codememory/shared';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolExecutor } from '../execution/ToolExecutor.js';
import { ToolCallOrchestrator } from '../orchestration/ToolCallOrchestrator.js';

describe('ToolCallOrchestrator Unit Tests', () => {
  it('orchestrates AI tool calls to ToolRuntime execution and passes results back to provider', async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: 'search_memories',
      parameters: { type: 'object' },
      execute: async (args) => ({ success: true, content: `found: ${args.query}` }),
    });

    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: true, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: true, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi
        .fn()
        .mockResolvedValueOnce(
          ok({
            id: 'res_1',
            model: 'm',
            content: '',
            toolCalls: [{ id: 'tc1', name: 'search_memories', arguments: { query: 'main.ts' } }],
            finishReason: 'tool_calls',
          })
        )
        .mockResolvedValueOnce(
          ok({
            id: 'res_2',
            model: 'm',
            content: 'Found symbol main.ts',
            finishReason: 'stop',
          })
        ),
      generateStream: vi.fn() as any,
    };

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );

    const orchestrator = new ToolCallOrchestrator(mockProvider, executor);

    const res = await orchestrator.orchestrate({
      messages: [{ role: 'user', content: 'Search main.ts' }],
    });

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Found symbol main.ts');
    }
    expect(mockProvider.generate).toHaveBeenCalledTimes(2);
  });

  it('returns immediately when provider returns response with zero tool calls', async () => {
    const registry = new ToolRegistry();
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: true, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: true, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn().mockResolvedValue(
        ok({
          id: 'res_direct',
          model: 'm',
          content: 'Direct text response',
          finishReason: 'stop',
        })
      ),
      generateStream: vi.fn() as any,
    };

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );

    const orchestrator = new ToolCallOrchestrator(mockProvider, executor);
    const res = await orchestrator.orchestrate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Direct text response');
    }
    expect(mockProvider.generate).toHaveBeenCalledTimes(1);
  });

  it('returns failure Result when provider generate returns error', async () => {
    const registry = new ToolRegistry();
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: true, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: true, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn().mockResolvedValue(fail(new Error('Network error'))),
      generateStream: vi.fn() as any,
    };

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );

    const orchestrator = new ToolCallOrchestrator(mockProvider, executor);
    const res = await orchestrator.orchestrate({ messages: [{ role: 'user', content: 'hi' }] });

    expect(res.isFailure).toBe(true);
  });
});
