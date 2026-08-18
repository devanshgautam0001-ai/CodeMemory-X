import { EventEnvelope } from '../types/EventEnvelope.js';

export type IEventHandler<T = unknown> = (event: EventEnvelope<T>) => Promise<void> | void;

export interface SubscriptionOptions {
  priority?: number; // Higher number = executed earlier
  correlationIdFilter?: string;
}

export interface IEventSubscriber {
  subscribe<T>(
    eventType: string,
    handler: IEventHandler<T>,
    options?: SubscriptionOptions
  ): () => void; // Unsubscribe callback

  unsubscribe(eventType: string, handler: IEventHandler): void;
}
