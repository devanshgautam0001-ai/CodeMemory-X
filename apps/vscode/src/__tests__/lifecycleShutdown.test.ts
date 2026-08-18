import { describe, it, expect, vi } from 'vitest';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';
import { AIAssistantEngine } from '@codememory/ai-assistant';

describe('TASK-059 Extension Lifecycle & Shutdown Hardening Suite', () => {
  it('1. AIAssistantEngine.cancelAll aborts active streaming requests on shutdown', () => {
    const mockProvider = {
      id: 'ollama',
      defaultModel: 'llama3',
      generateStream: async function* () {
        yield { contentDelta: 'hello' };
      },
    };

    const engine = new AIAssistantEngine({
      provider: mockProvider as any,
    });

    const abortSpy = vi.fn();
    (engine as any).activeControllers.set('req_test_1', { abort: abortSpy });

    engine.dispose();

    expect(abortSpy).toHaveBeenCalled();
    expect((engine as any).activeControllers.size).toBe(0);
  });

  it('2. VerticalSlicePipeline.dispose flushes eventStore, closes watcher, and cancels assistant requests', async () => {
    const pipeline = new VerticalSlicePipeline();
    const mockES = {
      flush: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
    };
    const mockAssistant = {
      dispose: vi.fn(),
    };

    (pipeline as any).eventStore = mockES;
    (pipeline as any).assistantEngine = mockAssistant;
    (pipeline as any).isInitialized = true;

    await pipeline.dispose();

    expect(mockAssistant.dispose).toHaveBeenCalled();
    expect(mockES.flush).toHaveBeenCalled();
    expect(mockES.close).toHaveBeenCalled();
  });
});
