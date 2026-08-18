import { DependencyRelationship } from './StoryTypes.js';

export interface StoryDependency {
  targetId: string;
  targetName: string;
  relationship: DependencyRelationship;
  firstObservedAt: string;
  lastObservedAt: string;
  active: boolean;
  confidence: number;
}
