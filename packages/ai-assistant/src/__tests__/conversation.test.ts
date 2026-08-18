import { describe, it, expect, vi } from 'vitest';
import { AssistantConversationRepository } from '../repository/AssistantConversationRepository.js';

describe('AssistantConversationRepository Unit Tests', () => {
  it('manages conversation message history deterministically', () => {
    const repo = new AssistantConversationRepository();
    repo.createConversation('conv_1', 'Test Conversation');
    repo.addMessage('conv_1', {
      id: 'm1',
      role: 'user',
      content: 'hello',
      timestamp: new Date().toISOString(),
    });

    expect(repo.get('conv_1')).toHaveLength(1);
    expect(repo.listConversations().map((c) => c.id)).toContain('conv_1');

    repo.clear('conv_1');
    expect(repo.get('conv_1')).toHaveLength(0);
  });

  it('supports tracking multiple isolated conversations simultaneously', () => {
    const repo = new AssistantConversationRepository();
    repo.addMessage('c1', { id: 'm1', role: 'user', content: 'c1 msg', timestamp: '' });
    repo.addMessage('c2', { id: 'm2', role: 'user', content: 'c2 msg', timestamp: '' });

    expect(repo.get('c1')).toHaveLength(1);
    expect(repo.get('c2')).toHaveLength(1);
    expect(repo.listConversations()).toHaveLength(2);
  });

  it('rebuilds conversation history deterministically from events', async () => {
    const repo = new AssistantConversationRepository();
    const mockEvents = [
      {
        id: 'e1',
        eventType: 'ASSISTANT_CONVERSATION_CREATED',
        timestamp: '2026-08-10T10:00:00.000Z',
        correlationId: 'conv_saved',
        source: 'ai-assistant',
        workspace: 'test',
        payload: { id: 'conv_saved', title: 'Saved Chat', createdAt: '2026-08-10T10:00:00.000Z', updatedAt: '2026-08-10T10:00:00.000Z', messageCount: 0 },
        metadata: {},
      },
      {
        id: 'e2',
        eventType: 'ASSISTANT_MESSAGE_ADDED',
        timestamp: '2026-08-10T10:00:01.000Z',
        correlationId: 'conv_saved',
        source: 'ai-assistant',
        workspace: 'test',
        payload: {
          conversationId: 'conv_saved',
          message: { id: 'msg_1', role: 'user', content: 'Persistent prompt', timestamp: '2026-08-10T10:00:01.000Z' },
        },
        metadata: {},
      },
    ];

    const rebuilt = await repo.rebuildFromEvents(mockEvents as any);
    expect(rebuilt).toBe(2);

    const history = repo.get('conv_saved');
    expect(history).toHaveLength(1);
    expect(history[0].content).toBe('Persistent prompt');
  });
});
