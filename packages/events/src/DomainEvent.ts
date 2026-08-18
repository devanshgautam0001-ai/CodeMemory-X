export interface DomainEvent<TPayload = unknown> {
  readonly eventName: string;
  readonly timestamp: string;
  readonly payload: TPayload;
}
