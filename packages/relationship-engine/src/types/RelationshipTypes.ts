export type EntityType =
  | 'Memory'
  | 'Intent'
  | 'Decision'
  | 'Symbol'
  | 'File'
  | 'Session'
  | 'Bug'
  | 'Refactor';

export type RelationshipType =
  | 'RELATED_TO'
  | 'CREATED_BY'
  | 'MODIFIED_BY'
  | 'BELONGS_TO'
  | 'AFFECTS'
  | 'DEPENDS_ON'
  | 'SUPERSEDES'
  | 'CAUSED_BY'
  | 'RESOLVES'
  | 'INTRODUCES'
  | 'RENAMES'
  | 'MOVES'
  | 'USES'
  | 'REFERENCES';

export interface EntityNode {
  id: string;
  type: EntityType;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  weight?: number;
  timestamp?: string;
}

export interface GraphPath {
  nodes: EntityNode[];
  relationships: Relationship[];
  totalWeight: number;
}
