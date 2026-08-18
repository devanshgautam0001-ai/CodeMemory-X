export type SymbolStatus = 'ACTIVE' | 'RENAMED' | 'MOVED' | 'DELETED' | 'UNKNOWN';

export type RationaleCertainty = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';

export type MilestoneType =
  | 'ADDED'
  | 'MODIFIED'
  | 'RENAMED'
  | 'MOVED'
  | 'REFACTORED'
  | 'BUG_FIXED'
  | 'DECISION'
  | 'DEPENDENCY_CHANGED'
  | 'RISK_CHANGED'
  | 'IMPACT_CHANGED'
  | 'SESSION_MILESTONE';

export type EvidenceSource =
  | 'GIT'
  | 'EVENT_STORE'
  | 'AST'
  | 'SYMBOL_GRAPH'
  | 'MEMORY'
  | 'SESSION'
  | 'INTENT'
  | 'DECISION'
  | 'DRIFT'
  | 'IMPACT';

export type EvidenceCertainty = 'OBSERVED' | 'INFERRED' | 'UNKNOWN';

export type DependencyRelationship =
  | 'CALLS'
  | 'IMPORTS'
  | 'IMPLEMENTS'
  | 'EXTENDS'
  | 'DEPENDS_ON'
  | 'USES'
  | 'REFERENCES';
