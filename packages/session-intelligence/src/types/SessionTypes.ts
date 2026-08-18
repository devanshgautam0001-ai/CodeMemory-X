export type SessionState =
  | 'EXPLORING'
  | 'IMPLEMENTING'
  | 'REFACTORING'
  | 'DEBUGGING'
  | 'OPTIMIZING'
  | 'DOCUMENTING'
  | 'TESTING'
  | 'MIXED'
  | 'UNKNOWN';

export type ActivityLevel = 'IDLE' | 'LOW' | 'ACTIVE' | 'HIGH';

export type EvidenceCertainty = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';
