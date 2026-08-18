import { DistanceDecay } from './DistanceDecay.js';

export interface ImpactFactors {
  directRelationship?: number;      // 0.0 to 1.0
  reverseDependency?: number;       // 0.0 to 1.0
  historicalCoChange?: number;      // 0.0 to 1.0
  relationshipStrength?: number;    // 0.0 to 1.0
  architecturalRelevance?: number;  // 0.0 to 1.0
  memoryRelevance?: number;         // 0.0 to 1.0
  confidenceEvidence?: number;      // 0.0 to 1.0
}

export class ImpactScorer {
  private decay: DistanceDecay;
  private readonly weights = {
    directRelationship: 0.25,
    reverseDependency: 0.15,
    historicalCoChange: 0.15,
    relationshipStrength: 0.15,
    architecturalRelevance: 0.10,
    memoryRelevance: 0.10,
    confidenceEvidence: 0.10,
  };

  constructor(distanceDecay?: DistanceDecay) {
    this.decay = distanceDecay ?? new DistanceDecay();
  }

  public calculateScore(factors: ImpactFactors, distance = 1): number {
    const dr = factors.directRelationship ?? 0;
    const rd = factors.reverseDependency ?? 0;
    const hc = factors.historicalCoChange ?? 0;
    const rs = factors.relationshipStrength ?? 0;
    const ar = factors.architecturalRelevance ?? 0;
    const mr = factors.memoryRelevance ?? 0;
    const ce = factors.confidenceEvidence ?? 1.0;

    const weightedSum =
      dr * this.weights.directRelationship +
      rd * this.weights.reverseDependency +
      hc * this.weights.historicalCoChange +
      rs * this.weights.relationshipStrength +
      ar * this.weights.architecturalRelevance +
      mr * this.weights.memoryRelevance +
      ce * this.weights.confidenceEvidence;

    const totalWeight =
      this.weights.directRelationship +
      this.weights.reverseDependency +
      this.weights.historicalCoChange +
      this.weights.relationshipStrength +
      this.weights.architecturalRelevance +
      this.weights.memoryRelevance +
      this.weights.confidenceEvidence;

    const rawScore = weightedSum / totalWeight;
    const decayFactor = this.decay.getFactor(distance);
    const finalScore = Math.max(0.0, Math.min(1.0, rawScore * decayFactor));

    return Number(finalScore.toFixed(4));
  }
}
