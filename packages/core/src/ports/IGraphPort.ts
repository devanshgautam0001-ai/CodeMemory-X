import { Result } from '@codememory/shared';

export interface GraphNode {
  id: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  relation: string;
  weight?: number;
}

export interface IGraphPort {
  addNode(node: GraphNode): Promise<Result<void>>;
  addEdge(edge: GraphEdge): Promise<Result<void>>;
  getNeighbors(nodeId: string, depth?: number): Promise<Result<GraphNode[]>>;
}
