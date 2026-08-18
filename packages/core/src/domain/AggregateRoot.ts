import { Entity } from './Entity.js';

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private _domainEvents: unknown[] = [];

  get domainEvents(): unknown[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: unknown): void {
    this._domainEvents.push(domainEvent);
  }

  clearEvents(): void {
    this._domainEvents = [];
  }
}
