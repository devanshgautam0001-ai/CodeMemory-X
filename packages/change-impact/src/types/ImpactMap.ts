import { ImpactNode } from './ImpactNode.js';
import { ImpactEdge } from './ImpactEdge.js';

export interface ImpactMap {
  rootId: string;
  rootType: string;
  nodes: ImpactNode[];
  edges: ImpactEdge[];
  totalAffectedEntities: number;
  maximumDepth: number;
  overallImpactScore: number;
  overallConfidence: number;
  generatedAt: string;
}
