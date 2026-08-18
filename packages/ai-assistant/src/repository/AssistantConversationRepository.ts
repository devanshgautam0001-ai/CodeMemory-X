import { EventStore, EventRecord } from '@codememory/event-store';
import { ILogger } from '@codememory/logging';
import { AssistantMessage } from '../types/AssistantTypes.js';
import { AssistantSecurityPolicy } from '../security/AssistantSecurityPolicy.js';

export interface AssistantConversationMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export class AssistantConversationRepository {
  private conversations = new Map<string, AssistantMessage[]>();
  private metadata = new Map<string, AssistantConversationMeta>();

  constructor(
    private readonly eventStore?: EventStore,
    private readonly workspacePath: string = 'global',
    private readonly logger?: ILogger
  ) {}

  public createConversation(conversationId?: string, title?: string): AssistantConversationMeta {
    const id = conversationId ?? `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const meta: AssistantConversationMeta = {
      id,
      title: title ?? `Conversation ${this.metadata.size + 1}`,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    if (!this.conversations.has(id)) {
      this.conversations.set(id, []);
    }
    this.metadata.set(id, meta);

    if (this.metadata.size > 500) {
      let oldestId: string | null = null;
      let oldestTime = Infinity;
      for (const [mId, mMeta] of this.metadata.entries()) {
        const time = new Date(mMeta.updatedAt).getTime();
        if (time < oldestTime) {
          oldestTime = time;
          oldestId = mId;
        }
      }
      if (oldestId) {
        this.conversations.delete(oldestId);
        this.metadata.delete(oldestId);
      }
    }

    if (this.eventStore) {
      this.eventStore.appendEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: 'ASSISTANT_CONVERSATION_CREATED',
        timestamp: now,
        correlationId: id,
        source: 'ai-assistant',
        workspace: this.workspacePath,
        payload: meta,
        metadata: {},
      });
    }

    return meta;
  }

  public get(conversationId: string): AssistantMessage[] {
    const messages = this.conversations.get(conversationId) ?? [];
    return [...messages].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }

  public addMessage(conversationId: string, message: AssistantMessage, metadata?: { provider?: string; model?: string }): void {
    if (!this.conversations.has(conversationId)) {
      this.createConversation(conversationId);
    }

    const sanitizedContent = AssistantSecurityPolicy.sanitize(message.content);
    const sanitizedMsg: AssistantMessage = {
      ...message,
      content: sanitizedContent,
    };

    const existing = this.conversations.get(conversationId)!;
    if (existing.some((m) => m.id === sanitizedMsg.id)) {
      return;
    }

    existing.push(sanitizedMsg);
    if (existing.length > 1000) {
      existing.shift();
    }

    const meta = this.metadata.get(conversationId);
    if (meta) {
      meta.updatedAt = sanitizedMsg.timestamp;
      meta.messageCount = existing.length;
    }

    if (this.eventStore) {
      this.eventStore.appendEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: 'ASSISTANT_MESSAGE_ADDED',
        timestamp: sanitizedMsg.timestamp,
        correlationId: conversationId,
        source: 'ai-assistant',
        workspace: this.workspacePath,
        payload: {
          conversationId,
          message: sanitizedMsg,
          provider: metadata?.provider,
          model: metadata?.model,
        },
        metadata: {},
      });
    }
  }

  public clear(conversationId: string): void {
    this.conversations.set(conversationId, []);
    const meta = this.metadata.get(conversationId);
    if (meta) {
      meta.updatedAt = new Date().toISOString();
      meta.messageCount = 0;
    }

    if (this.eventStore) {
      this.eventStore.appendEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: 'ASSISTANT_CONVERSATION_CLEARED',
        timestamp: new Date().toISOString(),
        correlationId: conversationId,
        source: 'ai-assistant',
        workspace: this.workspacePath,
        payload: { conversationId },
        metadata: {},
      });
    }
  }

  public deleteConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
    this.metadata.delete(conversationId);

    if (this.eventStore) {
      this.eventStore.appendEvent({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: 'ASSISTANT_CONVERSATION_DELETED',
        timestamp: new Date().toISOString(),
        correlationId: conversationId,
        source: 'ai-assistant',
        workspace: this.workspacePath,
        payload: { conversationId },
        metadata: {},
      });
    }
  }

  public listConversations(): AssistantConversationMeta[] {
    return Array.from(this.metadata.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public async rebuildFromEvents(events: EventRecord[]): Promise<number> {
    let processed = 0;
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (const evt of sortedEvents) {
      try {
        if (evt.eventType === 'ASSISTANT_CONVERSATION_CREATED') {
          const payload = evt.payload as AssistantConversationMeta;
          if (payload && payload.id) {
            this.metadata.set(payload.id, {
              id: payload.id,
              title: payload.title ?? `Conversation`,
              createdAt: payload.createdAt ?? evt.timestamp,
              updatedAt: payload.updatedAt ?? evt.timestamp,
              messageCount: 0,
            });
            if (!this.conversations.has(payload.id)) {
              this.conversations.set(payload.id, []);
            }
            processed++;
          }
        } else if (evt.eventType === 'ASSISTANT_MESSAGE_ADDED') {
          const payload = evt.payload as { conversationId: string; message: AssistantMessage };
          if (payload && payload.conversationId && payload.message) {
            if (!this.conversations.has(payload.conversationId)) {
              this.conversations.set(payload.conversationId, []);
              this.metadata.set(payload.conversationId, {
                id: payload.conversationId,
                title: `Conversation`,
                createdAt: evt.timestamp,
                updatedAt: evt.timestamp,
                messageCount: 0,
              });
            }
            const existing = this.conversations.get(payload.conversationId)!;
            if (!existing.some((m) => m.id === payload.message.id)) {
              existing.push(payload.message);
              const meta = this.metadata.get(payload.conversationId);
              if (meta) {
                meta.updatedAt = payload.message.timestamp;
                meta.messageCount = existing.length;
              }
              processed++;
            }
          }
        } else if (evt.eventType === 'ASSISTANT_CONVERSATION_CLEARED') {
          const payload = evt.payload as { conversationId: string };
          if (payload && payload.conversationId) {
            this.conversations.set(payload.conversationId, []);
            const meta = this.metadata.get(payload.conversationId);
            if (meta) {
              meta.messageCount = 0;
              meta.updatedAt = evt.timestamp;
            }
            processed++;
          }
        } else if (evt.eventType === 'ASSISTANT_CONVERSATION_DELETED') {
          const payload = evt.payload as { conversationId: string };
          if (payload && payload.conversationId) {
            this.conversations.delete(payload.conversationId);
            this.metadata.delete(payload.conversationId);
            processed++;
          }
        }
      } catch (err) {
        this.logger?.warn(`[AssistantConversationRepository] Error processing event during rebuild:`, { error: (err as Error).message });
      }
    }

    this.logger?.info(`[AssistantConversationRepository] Rebuilt ${this.metadata.size} conversations from ${processed} events`);
    return processed;
  }
}
