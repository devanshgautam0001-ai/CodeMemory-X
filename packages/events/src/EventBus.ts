import { DomainEvent } from './DomainEvent.js';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...existing, handler as EventHandler]);
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const registeredHandlers = this.handlers.get(event.eventName) || [];
    await Promise.all(registeredHandlers.map((h) => h(event)));
  }

  clear(): void {
    this.handlers.clear();
  }
}
