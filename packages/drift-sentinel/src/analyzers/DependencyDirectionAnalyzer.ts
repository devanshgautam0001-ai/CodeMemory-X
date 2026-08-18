import { SymbolGraph } from '@codememory/symbol-graph';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';
import { DriftEvidence } from '../types/DriftEvidence.js';

export interface RawDriftFindingInput {
  type: any;
  title: string;
  summary: string;
  affectedFiles: string[];
  affectedSymbols: string[];
  affectedPackages: string[];
  baselineEvidence: DriftEvidence[];
  currentEvidence: DriftEvidence[];
  relatedDecisions: string[];
  factors: {
    boundaryViolation?: number;
    dependencyChange?: number;
    couplingIncrease?: number;
    decisionConflict?: number;
    historicalDeviation?: number;
    relationshipChange?: number;
  };
}

export class DependencyDirectionAnalyzer {
  public analyze(graph: SymbolGraph, baseline: ArchitecturalBaseline): RawDriftFindingInput[] {
    const findings: RawDriftFindingInput[] = [];
    const timestamp = new Date().toISOString();

    const edges = graph.getAllEdges();
    const nodesMap = new Map(graph.getAllNodes().map((n) => [n.id, n]));

    for (const edge of edges) {
      const sourceNode = nodesMap.get(edge.fromId);
      const targetNode = nodesMap.get(edge.toId);

      if (!sourceNode || !targetNode) continue;

      const srcPath = sourceNode.location?.filePath ?? (sourceNode as any).filePath ?? '';
      const tgtPath = targetNode.location?.filePath ?? (targetNode as any).filePath ?? '';

      const sourcePkg = this.extractPackageName(srcPath);
      const targetPkg = this.extractPackageName(tgtPath);

      if (!sourcePkg || !targetPkg || sourcePkg === targetPkg) continue;

      // Check against Package Dependency Rules
      const rule = baseline.packageDependencies.find((r) => r.packageName === sourcePkg);
      if (rule && rule.disallowedDependencies.includes(targetPkg)) {
        findings.push({
          type: 'DEPENDENCY_DIRECTION_DRIFT',
          title: `Illegal Dependency Direction (${sourcePkg} → ${targetPkg})`,
          summary: `Package '${sourcePkg}' imports '${targetPkg}', which violates established architectural layer direction rules.`,
          affectedFiles: [srcPath, tgtPath],
          affectedSymbols: [sourceNode.id, targetNode.id],
          affectedPackages: [sourcePkg, targetPkg],
          baselineEvidence: [
            {
              id: `ev_base_${sourcePkg}`,
              source: 'architectural-baseline',
              description: `'${sourcePkg}' disallowed dependencies: [${rule.disallowedDependencies.join(', ')}]`,
              expectedValue: rule.allowedDependencies,
              timestamp,
            },
          ],
          currentEvidence: [
            {
              id: `ev_curr_${edge.id}`,
              source: 'symbol-graph',
              description: `New dependency edge detected from ${srcPath} to ${tgtPath}`,
              observedValue: `${sourcePkg} -> ${targetPkg}`,
              timestamp,
            },
          ],
          relatedDecisions: [],
          factors: {
            boundaryViolation: 0.90,
            dependencyChange: 0.85,
          },
        });
      }
    }

    return findings;
  }

  private extractPackageName(filePath: string): string | null {
    if (filePath.includes('packages/')) {
      const parts = filePath.split('packages/')[1].split('/');
      return `@codememory/${parts[0]}`;
    }
    if (filePath.includes('apps/')) {
      const parts = filePath.split('apps/')[1].split('/');
      return `codememory-x-${parts[0]}`;
    }
    return null;
  }
}
