import { ImpactEntityType } from './ImpactTypes.js';
import { ImpactReason } from './ImpactReason.js';

export interface ImpactNode {
  id: string;
  entityType: ImpactEntityType;
  name: string;
  path?: string;
  impactScore: number; // 0.0 to 1.0
  confidence: number;  // 0.0 to 1.0
  reasons: ImpactReason[];
  distance: number;
}
