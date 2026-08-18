import { EdgeType } from '../types/EdgeType.js';
import { LocationInfo } from '@codememory/parser-sdk';

export interface GraphEdgeProps {
  id: string; // Deterministic Edge ID
  fromId: string;
  toId: string;
  type: EdgeType;
  location?: LocationInfo;
  metadata?: Record<string, unknown>;
}

export class GraphEdge {
  constructor(public readonly props: GraphEdgeProps) {}

  get id(): string {
    return this.props.id;
  }

  get fromId(): string {
    return this.props.fromId;
  }

  get toId(): string {
    return this.props.toId;
  }

  get type(): EdgeType {
    return this.props.type;
  }
}
