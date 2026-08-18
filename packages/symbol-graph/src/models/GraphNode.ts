import { SymbolInfo, LocationInfo } from '@codememory/parser-sdk';

export interface GraphNodeProps {
  id: string; // Deterministic Hash ID
  name: string;
  kind: string;
  language: string;
  location: LocationInfo;
  rawSymbol?: SymbolInfo;
  metadata?: Record<string, unknown>;
}

export class GraphNode {
  constructor(public readonly props: GraphNodeProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get kind(): string {
    return this.props.kind;
  }

  get language(): string {
    return this.props.language;
  }

  get location(): LocationInfo {
    return this.props.location;
  }
}
