export interface EventMetadata {
  priority?: number; // Higher number = higher execution priority
  retryCount?: number;
  environment?: string;
  producerVersion?: string;
  tags?: string[];
  [key: string]: unknown;
}
