import { describe, it, expect, vi } from 'vitest';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';

describe('AIAssistantEngine Request Cancellation & Disposal Hardening Suite', () => {
  it('1. cancel(requestId) aborts specific request AbortController', () => {
    const mockProvider = {
      id: 'ollama',
      defaultModel: 'llama3',
      generateStream: async function* () {},
    };

    const engine = new AIAssistantEngine({ provider: mockProvider as any });

    const abortSpy = vi.fn();
    (engine as any).activeControllers.set('req_target', { abort: abortSpy });
    (engine as any).activeControllers.set('req_other', { abort: vi.fn() });

    engine.cancel('req_target');

    expect(abortSpy).toHaveBeenCalled();
    expect((engine as any).activeControllers.has('req_target')).toBe(false);
    expect((engine as any).activeControllers.has('req_other')).toBe(true);
  });

  it('2. cancel(undefined, conversationId) cancels pending approvals for conversation', () => {
    const mockProvider = { id: 'ollama', defaultModel: 'llama3' };
    const engine = new AIAssistantEngine({ provider: mockProvider as any });

    const cancelSpy = vi.spyOn((engine as any).approvalManager, 'cancelConversationApprovals');
    engine.cancel(undefined, 'conv_123');

    expect(cancelSpy).toHaveBeenCalledWith('conv_123');
  });

  it('3. cancelAll() aborts all active controllers and pending approvals', () => {
    const mockProvider = { id: 'ollama', defaultModel: 'llama3' };
    const engine = new AIAssistantEngine({ provider: mockProvider as any });

    const spy1 = vi.fn();
    const spy2 = vi.fn();
    (engine as any).activeControllers.set('req_1', { abort: spy1 });
    (engine as any).activeControllers.set('req_2', { abort: spy2 });

    const approvalCancelSpy = vi.spyOn((engine as any).approvalManager, 'cancelAllPending');

    engine.cancelAll();

    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect((engine as any).activeControllers.size).toBe(0);
    expect(approvalCancelSpy).toHaveBeenCalled();
  });

  it('4. dispose() calls cancelAll() and disposes approvalManager', () => {
    const mockProvider = { id: 'ollama', defaultModel: 'llama3' };
    const engine = new AIAssistantEngine({ provider: mockProvider as any });

    const cancelAllSpy = vi.spyOn(engine, 'cancelAll');
    const approvalDisposeSpy = vi.spyOn((engine as any).approvalManager, 'dispose');

    engine.dispose();

    expect(cancelAllSpy).toHaveBeenCalled();
    expect(approvalDisposeSpy).toHaveBeenCalled();
  });
});
