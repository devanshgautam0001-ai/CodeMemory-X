import { DriftSentinel } from '@codememory/drift-sentinel';
import { SessionRisk } from '../types/SessionSummary.js';

export class RiskAggregator {
  public aggregate(activeFiles: string[], driftSentinel?: DriftSentinel): SessionRisk[] {
    if (!driftSentinel || activeFiles.length === 0) return [];

    const risks: SessionRisk[] = [];

    for (const file of activeFiles) {
      const findings = driftSentinel.getFindingsForFile(file);
      for (const finding of findings) {
        if (!risks.some((r) => r.id === finding.id)) {
          risks.push({
            id: finding.id,
            type: finding.type,
            severity: finding.severity,
            title: finding.title,
            summary: finding.summary,
          });
        }
      }
    }

    return risks;
  }
}
