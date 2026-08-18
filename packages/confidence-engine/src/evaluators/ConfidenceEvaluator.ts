import {
  EvidencePayload,
  FactorBreakdown,
  FactorWeights,
  ConfidenceExplanation,
  ConfidenceResult,
} from '../types/ConfidenceTypes.js';

export class ConfidenceEvaluator {
  private readonly defaultWeights: FactorWeights = {
    sourceReliability: 0.20,
    temporalConsistency: 0.15,
    relationshipStrength: 0.15,
    crossSourceAgreement: 0.15,
    recency: 0.10,
    structuralEvidence: 0.15,
    resolutionEvidence: 0.10,
  };

  public evaluate(evidence: EvidencePayload, customWeights?: Partial<FactorWeights>): ConfidenceResult {
    const weights: FactorWeights = { ...this.defaultWeights, ...customWeights };
    const explanations: string[] = [];

    // 1. Source Reliability
    const sourceReliability = this.evalSourceReliability(evidence.sources, explanations);

    // 2. Temporal Consistency
    const temporalConsistency = this.evalTemporalConsistency(
      evidence.occurrenceCount,
      evidence.sessionCount,
      explanations
    );

    // 3. Relationship Strength
    const relationshipStrength = this.evalRelationshipStrength(evidence.relationshipCount, explanations);

    // 4. Cross-Source Agreement
    const crossSourceAgreement = this.evalCrossSourceAgreement(evidence.sources, explanations);

    // 5. Recency
    const recency = this.evalRecency(evidence.timestamp, explanations);

    // 6. Structural Evidence
    const structuralEvidence = this.evalStructuralEvidence(
      evidence.hasValidAst,
      evidence.hasLocationInfo,
      explanations
    );

    // 7. Resolution Evidence
    const resolutionEvidence = this.evalResolutionEvidence(
      evidence.resolutionStatus,
      evidence.testStatus,
      explanations
    );

    const factors: FactorBreakdown = {
      sourceReliability,
      temporalConsistency,
      relationshipStrength,
      crossSourceAgreement,
      recency,
      structuralEvidence,
      resolutionEvidence,
    };

    // Calculate Weighted Linear Combination
    const weightedSum =
      factors.sourceReliability * weights.sourceReliability +
      factors.temporalConsistency * weights.temporalConsistency +
      factors.relationshipStrength * weights.relationshipStrength +
      factors.crossSourceAgreement * weights.crossSourceAgreement +
      factors.recency * weights.recency +
      factors.structuralEvidence * weights.structuralEvidence +
      factors.resolutionEvidence * weights.resolutionEvidence;

    const totalWeight =
      weights.sourceReliability +
      weights.temporalConsistency +
      weights.relationshipStrength +
      weights.crossSourceAgreement +
      weights.recency +
      weights.structuralEvidence +
      weights.resolutionEvidence;

    const normalizedScore = Number((weightedSum / totalWeight).toFixed(4));

    const explanation: ConfidenceExplanation = {
      factors,
      weights,
      explanations,
    };

    return {
      score: normalizedScore,
      explanation,
      timestamp: new Date().toISOString(),
    };
  }

  private evalSourceReliability(sources: string[], explanations: string[]): number {
    if (!sources || sources.length === 0) {
      explanations.push('Source Reliability: Low (Unknown or missing source engine).');
      return 0.50;
    }

    const reliabilityMap: Record<string, number> = {
      'extension-host': 1.0,
      'adr-markdown': 1.0,
      'git-engine': 0.95,
      'decision-capture-engine': 0.92,
      'tree-sitter-engine': 0.90,
      'intent-capture-engine': 0.88,
      'workspace-watcher': 0.80,
    };

    const scores = sources.map((s) => reliabilityMap[s] ?? 0.70);
    const maxScore = Math.max(...scores);
    explanations.push(`Source Reliability: ${maxScore >= 0.9 ? 'High' : 'Moderate'} (${sources.join(', ')}).`);
    return maxScore;
  }

  private evalTemporalConsistency(occurrences = 1, sessions = 1, explanations: string[]): number {
    if (sessions >= 3 || occurrences >= 5) {
      explanations.push(`Temporal Consistency: High (${occurrences} edits across ${sessions} sessions).`);
      return 1.0;
    } else if (sessions === 2 || occurrences >= 3) {
      explanations.push(`Temporal Consistency: Moderate (${occurrences} edits across ${sessions} sessions).`);
      return 0.85;
    } else if (occurrences === 2) {
      explanations.push('Temporal Consistency: Fair (Observed twice).');
      return 0.70;
    }
    explanations.push('Temporal Consistency: Initial (Observed once).');
    return 0.50;
  }

  private evalRelationshipStrength(relationshipCount = 0, explanations: string[]): number {
    if (relationshipCount >= 5) {
      explanations.push(`Relationship Strength: High (${relationshipCount} connected graph edges).`);
      return 1.0;
    } else if (relationshipCount >= 3) {
      explanations.push(`Relationship Strength: Moderate (${relationshipCount} connected graph edges).`);
      return 0.80;
    } else if (relationshipCount >= 1) {
      explanations.push(`Relationship Strength: Low (${relationshipCount} connected graph edge).`);
      return 0.60;
    }
    explanations.push('Relationship Strength: Isolated (0 connected graph edges).');
    return 0.40;
  }

  private evalCrossSourceAgreement(sources: string[], explanations: string[]): number {
    const distinct = new Set(sources ?? []);
    if (distinct.size >= 3) {
      explanations.push(`Cross-Source Agreement: High (Corroborated by ${distinct.size} distinct engines).`);
      return 1.0;
    } else if (distinct.size === 2) {
      explanations.push('Cross-Source Agreement: Moderate (Corroborated by 2 distinct engines).');
      return 0.85;
    }
    explanations.push('Cross-Source Agreement: Single Source.');
    return 0.65;
  }

  private evalRecency(timestamp: string, explanations: string[]): number {
    if (!timestamp) {
      explanations.push('Recency: Unknown timestamp.');
      return 0.50;
    }

    const ageMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
    const ageHours = ageMs / (1000 * 60 * 60);

    if (ageHours < 1) {
      explanations.push('Recency: Fresh (<1 hour ago).');
      return 1.0;
    } else if (ageHours < 24) {
      explanations.push('Recency: Recent (<24 hours ago).');
      return 0.90;
    } else if (ageHours < 168) { // 7 days
      explanations.push('Recency: Active (<7 days ago).');
      return 0.75;
    } else if (ageHours < 720) { // 30 days
      explanations.push('Recency: Stale (<30 days ago).');
      return 0.60;
    }
    explanations.push('Recency: Aged (>30 days ago).');
    return 0.40;
  }

  private evalStructuralEvidence(hasAst = false, hasLoc = false, explanations: string[]): number {
    if (hasAst && hasLoc) {
      explanations.push('Structural Evidence: Verified (Valid AST & precise line range).');
      return 1.0;
    } else if (hasAst) {
      explanations.push('Structural Evidence: Partial (Valid AST, missing line range).');
      return 0.80;
    } else if (hasLoc) {
      explanations.push('Structural Evidence: Partial (Line location known, unparsed AST).');
      return 0.70;
    }
    explanations.push('Structural Evidence: Unverified AST structure.');
    return 0.50;
  }

  private evalResolutionEvidence(resolutionStatus: string | undefined, testStatus: string | undefined, explanations: string[]): number {
    if (resolutionStatus === 'accepted' || resolutionStatus === 'resolved') {
      explanations.push(`Resolution Evidence: Verified (${resolutionStatus}).`);
      return 1.0;
    } else if (testStatus === 'passing') {
      explanations.push('Resolution Evidence: Passing Tests.');
      return 0.95;
    } else if (resolutionStatus === 'proposed' || resolutionStatus === 'open') {
      explanations.push(`Resolution Evidence: Pending (${resolutionStatus}).`);
      return 0.70;
    } else if (resolutionStatus === 'deprecated' || testStatus === 'failing') {
      explanations.push(`Resolution Evidence: Low (${resolutionStatus || testStatus}).`);
      return 0.30;
    }
    explanations.push('Resolution Evidence: Unverified.');
    return 0.60;
  }
}
