import { Result } from '@codememory/shared';
import { EventEnvelope } from '../types/EventEnvelope.js';
import { IEventPublisher } from './IEventPublisher.js';
import { IEventSubscriber, IEventHandler, SubscriptionOptions } from './IEventSubscriber.js';

export interface ReplayOptions {
  eventType?: string;
  correlationId?: string;
  fromTimestamp?: string;
  limit?: number;
}

export interface IEventBus extends IEventPublisher, IEventSubscriber {
  replay(options?: ReplayOptions, targetHandler?: IEventHandler): Promise<Result<number>>;
  getHistory(eventType?: string): EventEnvelope[];
  clearHistory(): void;
}
