import { describe, it, expect } from 'vitest';
import { AssistantConversationRepository } from '../repository/AssistantConversationRepository.js';

describe('AssistantConversationRepository Memory Bounds Suite', () => {
  it('1. limits conversations metadata in memory to 500 maximum', () => {
    const repo = new AssistantConversationRepository();

    for (let i = 0; i < 550; i++) {
      repo.createConversation(`conv_test_${i}`, `Title ${i}`);
    }

    const list = repo.listConversations();
    expect(list.length).toBe(500);
  });

  it('2. limits messages per conversation in memory to 1000 maximum', () => {
    const repo = new AssistantConversationRepository();
    const convId = 'conv_long';
    repo.createConversation(convId);

    for (let i = 0; i < 1050; i++) {
      repo.addMessage(convId, {
        id: `msg_${i}`,
        role: 'user',
        content: `Hello ${i}`,
        timestamp: new Date().toISOString(),
      });
    }

    const history = repo.get(convId);
    expect(history.length).toBe(1000);
    expect(history[0].id).toBe('msg_50'); // First 50 shifted out
  });
});
