export interface EvidencePayload {
  entityId: string;
  entityType: string;
  sources: string[];                // e.g. ['git-engine', 'tree-sitter-engine', 'intent-capture']
  timestamp: string;               // ISO 8601 creation/event timestamp
  occurrenceCount?: number;        // Number of observed events/edits
  sessionCount?: number;           // Number of distinct sessions
  relationshipCount?: number;      // Graph edge degree count
  hasValidAst?: boolean;           // Structural syntax AST verification
  hasLocationInfo?: boolean;       // Exact line range/file location known
  resolutionStatus?: 'accepted' | 'resolved' | 'proposed' | 'open' | 'deprecated';
  testStatus?: 'passing' | 'failing' | 'untested';
  metadata?: Record<string, unknown>;
}

export interface FactorBreakdown {
  sourceReliability: number;        // 0.0 - 1.0
  temporalConsistency: number;      // 0.0 - 1.0
  relationshipStrength: number;     // 0.0 - 1.0
  crossSourceAgreement: number;     // 0.0 - 1.0
  recency: number;                  // 0.0 - 1.0
  structuralEvidence: number;       // 0.0 - 1.0
  resolutionEvidence: number;       // 0.0 - 1.0
}

export interface FactorWeights {
  sourceReliability: number;        // e.g. 0.20
  temporalConsistency: number;      // e.g. 0.15
  relationshipStrength: number;     // e.g. 0.15
  crossSourceAgreement: number;     // e.g. 0.15
  recency: number;                  // e.g. 0.10
  structuralEvidence: number;       // e.g. 0.15
  resolutionEvidence: number;       // e.g. 0.10
}

export interface ConfidenceExplanation {
  factors: FactorBreakdown;
  weights: FactorWeights;
  explanations: string[];
}

export interface ConfidenceResult {
  score: number;                    // 0.0 to 1.0
  explanation: ConfidenceExplanation;
  timestamp: string;
}
