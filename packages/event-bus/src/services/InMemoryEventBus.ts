import { Result, ok, fail } from '@codememory/shared';
import { EventEnvelope } from '../types/EventEnvelope.js';
import { IEventBus, ReplayOptions } from '../ports/IEventBus.js';
import { IEventHandler, SubscriptionOptions } from '../ports/IEventSubscriber.js';
import { IDeadLetterQueue } from '../ports/IDeadLetterQueue.js';
import { ILogger } from '@codememory/logging';

interface RegisteredSubscription {
  handler: IEventHandler;
  priority: number;
  correlationIdFilter?: string;
}

export class InMemoryEventBus implements IEventBus {
  private subscriptions: Map<string, RegisteredSubscription[]> = new Map();
  private history: EventEnvelope[] = [];
  private maxHistorySize = 1000;

  constructor(
    private readonly deadLetterQueue?: IDeadLetterQueue,
    private readonly logger?: ILogger
  ) {}

  public async publish<T>(event: EventEnvelope<T>): Promise<Result<void>> {
    try {
      // Ensure required envelope parameters
      if (!event.id) event.id = this.generateUuid();
      if (!event.timestamp) event.timestamp = new Date().toISOString();
      if (!event.correlationId) event.correlationId = event.id;

      this.history.push(event as EventEnvelope);
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }

      this.logger?.info(`[EventBus] Published ${event.type}`, {
        id: event.id,
        source: event.source,
        correlationId: event.correlationId,
      });

      const handlers = this.subscriptions.get(event.type) || [];
      // Sort by priority descending (higher priority executed first)
      const sorted = [...handlers].sort((a, b) => b.priority - a.priority);

      for (const sub of sorted) {
        if (
          sub.correlationIdFilter &&
          sub.correlationIdFilter !== event.correlationId
        ) {
          continue;
        }

        try {
          await sub.handler(event);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          this.logger?.error(`Error handling event ${event.type}`, error);

          if (this.deadLetterQueue) {
            await this.deadLetterQueue.enqueue(event as EventEnvelope, error);
          }
        }
      }

      return ok(undefined);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public async publishBatch<T>(events: EventEnvelope<T>[]): Promise<Result<void>> {
    for (const event of events) {
      const res = await this.publish(event);
      if (res.isFailure) return res;
    }
    return ok(undefined);
  }

  public subscribe<T>(
    eventType: string,
    handler: IEventHandler<T>,
    options?: SubscriptionOptions
  ): () => void {
    const existing = this.subscriptions.get(eventType) || [];
    const castHandler = handler as IEventHandler;
    if (existing.some((s) => s.handler === castHandler)) {
      return () => this.unsubscribe(eventType, castHandler);
    }

    const sub: RegisteredSubscription = {
      handler: castHandler,
      priority: options?.priority ?? 0,
      correlationIdFilter: options?.correlationIdFilter,
    };

    this.subscriptions.set(eventType, [...existing, sub]);
    this.logger?.info(`Subscribed to ${eventType} with priority ${sub.priority}`);

    return () => this.unsubscribe(eventType, castHandler);
  }

  public unsubscribe(eventType: string, handler: IEventHandler): void {
    const existing = this.subscriptions.get(eventType) || [];
    const filtered = existing.filter((s) => s.handler !== handler);
    if (filtered.length > 0) {
      this.subscriptions.set(eventType, filtered);
    } else {
      this.subscriptions.delete(eventType);
    }
    this.logger?.info(`Unsubscribed from ${eventType}`);
  }

  public async replay(
    options?: ReplayOptions,
    targetHandler?: IEventHandler
  ): Promise<Result<number>> {
    try {
      let filtered = [...this.history];

      if (options?.eventType) {
        filtered = filtered.filter((e) => e.type === options.eventType);
      }
      if (options?.correlationId) {
        filtered = filtered.filter((e) => e.correlationId === options.correlationId);
      }
      if (options?.fromTimestamp) {
        filtered = filtered.filter((e) => e.timestamp >= options.fromTimestamp!);
      }
      if (options?.limit && options.limit > 0) {
        filtered = filtered.slice(-options.limit);
      }

      this.logger?.info(`Replaying ${filtered.length} events from history...`);

      for (const evt of filtered) {
        if (targetHandler) {
          await targetHandler(evt);
        } else {
          await this.publish(evt);
        }
      }

      return ok(filtered.length);
    } catch (error) {
      return fail(error as Error);
    }
  }

  public getHistory(eventType?: string): EventEnvelope[] {
    if (!eventType) return [...this.history];
    return this.history.filter((e) => e.type === eventType);
  }

  public clearHistory(): void {
    this.history = [];
  }

  private generateUuid(): string {
    return 'evt_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
}
