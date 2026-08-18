import { DeveloperSession } from '../types/DeveloperSession.js';

export class SessionConfidenceScorer {
  public calculateConfidence(session: DeveloperSession): number {
    const evidenceCount = session.evidence.length;
    const observedCount = session.evidence.filter((e) => e.certainty === 'OBSERVED').length;
    const inferredCount = session.evidence.filter((e) => e.certainty === 'INFERRED').length;

    if (evidenceCount === 0) return 0.50;

    const observedRatio = observedCount / evidenceCount;
    const inferredRatio = inferredCount / evidenceCount;

    const baseScore = 0.60 + observedRatio * 0.35 + inferredRatio * 0.15;
    const activityBonus = session.activeFiles.length > 0 ? 0.05 : 0;

    const finalScore = Math.max(0.0, Math.min(1.0, baseScore + activityBonus));
    return Number(finalScore.toFixed(4));
  }
}
