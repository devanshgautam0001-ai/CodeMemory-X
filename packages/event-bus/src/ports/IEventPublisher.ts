import { Result } from '@codememory/shared';
import { EventEnvelope } from '../types/EventEnvelope.js';

export interface IEventPublisher {
  publish<T>(event: EventEnvelope<T>): Promise<Result<void>>;
  publishBatch<T>(events: EventEnvelope<T>[]): Promise<Result<void>>;
}
