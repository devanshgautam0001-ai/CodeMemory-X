import { ImpactType } from './ImpactTypes.js';

export interface ImpactReason {
  type: ImpactType;
  sourceId: string;
  description: string;
  strength: number; // 0.0 to 1.0
  evidenceIds: string[];
}
