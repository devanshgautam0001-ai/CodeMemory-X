export interface DriftFactorScores {
  boundaryViolation?: number;       // 0.0 - 1.0
  dependencyChange?: number;        // 0.0 - 1.0
  couplingIncrease?: number;        // 0.0 - 1.0
  decisionConflict?: number;        // 0.0 - 1.0
  historicalDeviation?: number;     // 0.0 - 1.0
  relationshipChange?: number;      // 0.0 - 1.0
  confidenceAdjustment?: number;    // 0.0 - 1.0
}

export class DriftScorer {
  private readonly weights = {
    boundaryViolation: 0.25,
    dependencyChange: 0.15,
    couplingIncrease: 0.15,
    decisionConflict: 0.20,
    historicalDeviation: 0.10,
    relationshipChange: 0.10,
    confidenceAdjustment: 0.05,
  };

  public calculateScore(factors: DriftFactorScores): number {
    const bv = factors.boundaryViolation ?? 0;
    const dc = factors.dependencyChange ?? 0;
    const ci = factors.couplingIncrease ?? 0;
    const dcf = factors.decisionConflict ?? 0;
    const hd = factors.historicalDeviation ?? 0;
    const rc = factors.relationshipChange ?? 0;
    const ca = factors.confidenceAdjustment ?? 1.0; // default 1.0 if not specified

    const weightedSum =
      bv * this.weights.boundaryViolation +
      dc * this.weights.dependencyChange +
      ci * this.weights.couplingIncrease +
      dcf * this.weights.decisionConflict +
      hd * this.weights.historicalDeviation +
      rc * this.weights.relationshipChange +
      ca * this.weights.confidenceAdjustment;

    const totalWeight =
      this.weights.boundaryViolation +
      this.weights.dependencyChange +
      this.weights.couplingIncrease +
      this.weights.decisionConflict +
      this.weights.historicalDeviation +
      this.weights.relationshipChange +
      this.weights.confidenceAdjustment;

    const score = weightedSum / totalWeight;
    const clampedScore = Math.max(0.0, Math.min(1.0, score));

    return Number(clampedScore.toFixed(4));
  }
}
