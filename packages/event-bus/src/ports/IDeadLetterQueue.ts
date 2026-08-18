import { Result } from '@codememory/shared';
import { EventEnvelope } from '../types/EventEnvelope.js';

export interface DeadLetterEntry {
  event: EventEnvelope;
  error: string;
  failedAt: string;
  retryAttempts: number;
}

export interface IDeadLetterQueue {
  enqueue(event: EventEnvelope, error: Error): Promise<Result<void>>;
  peek(limit?: number): Promise<Result<DeadLetterEntry[]>>;
  purge(): Promise<Result<void>>;
}
