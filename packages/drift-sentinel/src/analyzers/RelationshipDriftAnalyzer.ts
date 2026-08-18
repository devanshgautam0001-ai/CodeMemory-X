import { RelationshipEngine } from '@codememory/relationship-engine';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';
import { RawDriftFindingInput } from './DependencyDirectionAnalyzer.js';

export class RelationshipDriftAnalyzer {
  public analyze(relationshipEngine: RelationshipEngine, _baseline: ArchitecturalBaseline): RawDriftFindingInput[] {
    const findings: RawDriftFindingInput[] = [];
    const timestamp = new Date().toISOString();

    // Query high-risk relationship patterns (e.g., entity with excessive DEPENDS_ON or SUPERSEDES edges)
    const allRelationships = (relationshipEngine as any).relationships
      ? Array.from((relationshipEngine as any).relationships.values())
      : [];

    const supersedesCountMap = new Map<string, number>();

    for (const rel of allRelationships as any[]) {
      if (rel.type === 'SUPERSEDES') {
        supersedesCountMap.set(rel.sourceId, (supersedesCountMap.get(rel.sourceId) ?? 0) + 1);
      }
    }

    for (const [entityId, count] of supersedesCountMap.entries()) {
      if (count >= 3) {
        findings.push({
          type: 'RELATIONSHIP_PATTERN_DRIFT',
          title: `Relationship Pattern Drift (${entityId})`,
          summary: `Entity '${entityId}' has ${count} decision supersedes edges, indicating potential churn in architecture decisions.`,
          affectedFiles: [],
          affectedSymbols: [entityId],
          affectedPackages: [],
          baselineEvidence: [
            {
              id: `ev_base_rel_${entityId}`,
              source: 'relationship-engine',
              description: 'Stable architectural decisions should rarely be superseded repeatedly.',
              expectedValue: 1,
              timestamp,
            },
          ],
          currentEvidence: [
            {
              id: `ev_curr_rel_${entityId}`,
              source: 'relationship-engine',
              description: `Entity has ${count} SUPERSEDES relationship edges.`,
              observedValue: count,
              timestamp,
            },
          ],
          relatedDecisions: [],
          factors: {
            relationshipChange: 0.85,
            decisionConflict: 0.70,
          },
        });
      }
    }

    return findings;
  }
}
