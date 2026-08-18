export interface PackageDependencyRule {
  packageName: string;
  allowedDependencies: string[];
  disallowedDependencies: string[];
}

export interface ModuleCouplingMetric {
  modulePath: string;
  inboundEdgesCount: number;
  outboundEdgesCount: number;
  couplingRatio: number;
}

export interface SymbolResponsibilityMetric {
  symbolId: string;
  symbolName: string;
  referencingFilesCount: number;
  callCount: number;
}

export interface OwnershipPattern {
  modulePath: string;
  primaryAuthor: string;
  topAuthors: string[];
}

export interface ArchitecturalDecisionConstraint {
  decisionId: string;
  title: string;
  restrictedPattern: string;
  affectedFiles: string[];
}

export interface ArchitecturalBaseline {
  id: string;
  version: string;
  createdAt: string;
  packageDependencies: PackageDependencyRule[];
  allowedImportDirections: Record<string, string[]>;
  knownCycles: string[][];
  couplingMetrics: ModuleCouplingMetric[];
  symbolResponsibilities: SymbolResponsibilityMetric[];
  ownershipPatterns: OwnershipPattern[];
  decisionConstraints: ArchitecturalDecisionConstraint[];
  knownHotspots: string[];
  hash: string;
}
