import { StoryRiskPoint } from '../types/StoryRiskPoint.js';
import { DriftSentinel } from '@codememory/drift-sentinel';

export class RiskHistoryExtractor {
  public extractRiskHistory(filePath: string, driftSentinel?: DriftSentinel): StoryRiskPoint[] {
    if (!driftSentinel) return [];

    const findings = driftSentinel.getFindingsForFile(filePath);
    if (findings.length === 0) return [];

    const now = new Date().toISOString();
    const highestScore = Math.max(...findings.map((f) => f.score));

    return [
      {
        timestamp: now,
        riskScore: highestScore,
        impactScore: highestScore * 0.9,
        driftFindingIds: findings.map((f) => f.id),
        reason: `${findings.length} architectural drift findings detected for ${filePath}`,
        confidence: 0.92,
      },
    ];
  }
}
