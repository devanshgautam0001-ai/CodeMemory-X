import { GraphNode } from './GraphNode.js';
import { GraphEdge } from './GraphEdge.js';
import { EdgeType } from '../types/EdgeType.js';

export class SymbolGraph {
  private readonly nodes: Map<string, GraphNode>;
  private readonly edges: Map<string, GraphEdge>;

  constructor(
    nodesList: GraphNode[] = [],
    edgesList: GraphEdge[] = []
  ) {
    this.nodes = new Map(nodesList.map((n) => [n.id, n]));
    this.edges = new Map(edgesList.map((e) => [e.id, e]));
  }

  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): GraphEdge[] {
    return Array.from(this.edges.values());
  }

  public getEdges(fromId?: string, toId?: string, type?: EdgeType): GraphEdge[] {
    return Array.from(this.edges.values()).filter((e) => {
      if (fromId && e.fromId !== fromId) return false;
      if (toId && e.toId !== toId) return false;
      if (type && e.type !== type) return false;
      return true;
    });
  }

  public findDependents(id: string): GraphNode[] {
    const incomingEdges = this.getEdges(undefined, id);
    const dependentNodeIds = new Set(incomingEdges.map((e) => e.fromId));
    return Array.from(dependentNodeIds)
      .map((nodeId) => this.getNode(nodeId))
      .filter((n): n is GraphNode => n !== undefined);
  }

  public findDependencies(id: string): GraphNode[] {
    const outgoingEdges = this.getEdges(id, undefined);
    const dependencyNodeIds = new Set(outgoingEdges.map((e) => e.toId));
    return Array.from(dependencyNodeIds)
      .map((nodeId) => this.getNode(nodeId))
      .filter((n): n is GraphNode => n !== undefined);
  }

  public findCallers(id: string): GraphNode[] {
    const callEdges = this.getEdges(undefined, id, 'CALLS');
    const callerNodeIds = new Set(callEdges.map((e) => e.fromId));
    return Array.from(callerNodeIds)
      .map((nodeId) => this.getNode(nodeId))
      .filter((n): n is GraphNode => n !== undefined);
  }

  public findCallees(id: string): GraphNode[] {
    const callEdges = this.getEdges(id, undefined, 'CALLS');
    const calleeNodeIds = new Set(callEdges.map((e) => e.toId));
    return Array.from(calleeNodeIds)
      .map((nodeId) => this.getNode(nodeId))
      .filter((n): n is GraphNode => n !== undefined);
  }

  public merge(other: SymbolGraph): SymbolGraph {
    const mergedNodes = new Map([...this.nodes, ...other.nodes]);
    const mergedEdges = new Map([...this.edges, ...other.edges]);
    return new SymbolGraph(
      Array.from(mergedNodes.values()),
      Array.from(mergedEdges.values())
    );
  }
}
