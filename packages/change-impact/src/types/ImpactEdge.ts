import { ImpactType } from './ImpactTypes.js';

export interface ImpactEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: ImpactType;
  weight: number;
}
