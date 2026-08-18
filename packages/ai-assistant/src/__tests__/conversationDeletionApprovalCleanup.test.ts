import { describe, it, expect } from 'vitest';
import { AIAssistantEngine } from '../engine/AIAssistantEngine.js';

describe('Conversation Deletion & Clear Approval Cleanup', () => {
  it('should cancel pending tool approvals when deleteConversation is called', async () => {
    const mockProvider: any = {
      metadata: { id: 'mock', name: 'Mock' },
      capabilities: { streaming: false, toolCalling: true },
      generate: async () => ({ isSuccess: true, isFailure: false, value: { content: 'ok' } }),
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    const convId = 'conv_del_test_1';
    engine.createConversation('Test Conv');

    // Create a pending approval request for conv_del_test_1
    const manager = engine.getApprovalManager();
    const req = manager.createRequest('req_1', 'tc_1', 'search_memories', {}, 60000, convId);

    const waitPromise = manager.waitForApproval(req.approvalId, 60000);

    // Delete conversation
    engine.deleteConversation(convId);

    const state = await waitPromise;
    expect(state).toBe('CANCELLED');
  });

  it('should cancel pending tool approvals when clearConversation is called', async () => {
    const mockProvider: any = {
      metadata: { id: 'mock', name: 'Mock' },
      capabilities: { streaming: false, toolCalling: true },
      generate: async () => ({ isSuccess: true, isFailure: false, value: { content: 'ok' } }),
    };

    const engine = new AIAssistantEngine({ provider: mockProvider });
    const convId = 'conv_clear_test_1';

    const manager = engine.getApprovalManager();
    const req = manager.createRequest('req_2', 'tc_2', 'get_symbol_story', {}, 60000, convId);

    const waitPromise = manager.waitForApproval(req.approvalId, 60000);

    // Clear conversation
    engine.clearConversation(convId);

    const state = await waitPromise;
    expect(state).toBe('CANCELLED');
  });
});
