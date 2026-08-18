import { describe, it, expect, vi } from 'vitest';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';
import { IAIProvider } from '@codememory/ai-provider';
import { ok } from '@codememory/shared';
import { ToolRegistry, ToolPermissionManager, ToolExecutionAuditor, ToolExecutor } from '@codememory/tool-runtime';

describe('AIAssistantEngine Tool Orchestration Unit Tests', () => {
  it('orchestrates ToolRuntime calls through IAIProvider when tools are enabled', async () => {
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: true, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: true, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi
        .fn()
        .mockResolvedValueOnce(
          ok({
            id: 'r1',
            model: 'm',
            content: '',
            toolCalls: [{ id: 'tc1', name: 'search_memories', arguments: { query: 'test' } }],
            finishReason: 'tool_calls',
          })
        )
        .mockResolvedValueOnce(
          ok({
            id: 'r2',
            model: 'm',
            content: 'Found memory for query test',
            finishReason: 'stop',
          })
        ),
      generateStream: vi.fn() as any,
    };

    const registry = new ToolRegistry();
    registry.register({
      name: 'search_memories',
      parameters: {},
      execute: async () => ({ success: true, content: 'memory_item' }),
    });

    const executor = new ToolExecutor(
      registry,
      new ToolPermissionManager({ defaultPermission: 'ALLOW' }),
      new ToolExecutionAuditor()
    );

    const engine = new AIAssistantEngine({
      provider: mockProvider,
      toolRegistry: registry,
      toolExecutor: executor,
    });

    const res = await engine.ask({ requestId: 'req_1', prompt: 'Search test memories' });

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Found memory for query test');
    }
  });

  it('bypasses tool orchestration when enableTools is explicitly set to false', async () => {
    const mockProvider: IAIProvider = {
      metadata: { id: 'mock', name: 'Mock', vendor: 'Mock', defaultModel: 'm', supportedModels: [], isLocal: true },
      capabilities: { streaming: false, toolCalling: true, jsonMode: false, vision: false, reasoning: false, embeddings: false, functionCalling: true, contextLength: 1000, supportsTemperature: true, maxTokens: 1000 },
      generate: vi.fn().mockResolvedValue(ok({ id: 'r1', model: 'm', content: 'Direct answer', finishReason: 'stop' })),
      generateStream: vi.fn() as any,
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    const res = await engine.ask({
      requestId: 'req_2',
      prompt: 'Direct question',
      options: { enableTools: false },
    });

    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.content).toBe('Direct answer');
    }
  });
});
