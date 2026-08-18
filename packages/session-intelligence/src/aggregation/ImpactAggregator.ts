import { ChangeImpactEngine } from '@codememory/change-impact';
import { SessionImpactSummary } from '../types/SessionSummary.js';

export class ImpactAggregator {
  public aggregate(activeFiles: string[], changeImpactEngine?: ChangeImpactEngine): SessionImpactSummary | undefined {
    if (!changeImpactEngine || activeFiles.length === 0) return undefined;

    let totalAffected = 0;
    let highImpact = 0;
    let sumScore = 0;
    let sumConf = 0;
    let count = 0;

    for (const file of activeFiles) {
      const map = changeImpactEngine.analyzeFile(file);
      if (map) {
        totalAffected += map.totalAffectedEntities;
        highImpact += map.nodes.filter((n) => n.id !== map.rootId && n.impactScore >= 0.70).length;
        sumScore += map.overallImpactScore;
        sumConf += map.overallConfidence;
        count += 1;
      }
    }

    if (count === 0) return undefined;

    return {
      totalAffectedEntities: totalAffected,
      highImpactEntities: highImpact,
      overallImpactScore: Number((sumScore / count).toFixed(4)),
      overallConfidence: Number((sumConf / count).toFixed(4)),
    };
  }
}
