import { SymbolGraph } from '@codememory/symbol-graph';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';
import { RawDriftFindingInput } from './DependencyDirectionAnalyzer.js';

export class BoundaryAnalyzer {
  public analyze(graph: SymbolGraph, _baseline: ArchitecturalBaseline): RawDriftFindingInput[] {
    const findings: RawDriftFindingInput[] = [];
    const timestamp = new Date().toISOString();

    const nodesMap = new Map(graph.getAllNodes().map((n) => [n.id, n]));

    for (const edge of graph.getAllEdges()) {
      const srcNode = nodesMap.get(edge.fromId);
      const tgtNode = nodesMap.get(edge.toId);

      if (!srcNode || !tgtNode) continue;

      const srcPath = srcNode.location?.filePath ?? (srcNode as any).filePath ?? '';
      const tgtPath = tgtNode.location?.filePath ?? (tgtNode as any).filePath ?? '';

      const srcPkg = this.extractPackageName(srcPath);
      const tgtPkg = this.extractPackageName(tgtPath);

      // Check for API boundary bypass (importing internal/private implementation file directly instead of index.ts barrel)
      if (srcPkg && tgtPkg && srcPkg !== tgtPkg) {
        const isTargetInternalFile =
          tgtPath.includes('/src/internal/') ||
          (tgtPath.includes('/src/') && !tgtPath.endsWith('/index.ts'));

        if (isTargetInternalFile) {
          findings.push({
            type: 'API_BOUNDARY_DRIFT',
            title: `API Boundary Bypass (${srcPkg} → ${tgtPath})`,
            summary: `Package '${srcPkg}' directly imports internal file '${tgtPath}' instead of consuming exported package API barrel.`,
            affectedFiles: [srcPath, tgtPath],
            affectedSymbols: [srcNode.id, tgtNode.id],
            affectedPackages: [srcPkg, tgtPkg],
            baselineEvidence: [
              {
                id: `ev_base_boundary_${tgtPkg}`,
                source: 'architectural-baseline',
                description: `Package '${tgtPkg}' internal files must not be directly imported across package boundaries.`,
                expectedValue: `${tgtPkg}/index.ts`,
                timestamp,
              },
            ],
            currentEvidence: [
              {
                id: `ev_curr_boundary_${edge.id}`,
                source: 'symbol-graph',
                description: `Direct import from ${srcPath} to ${tgtPath}`,
                observedValue: tgtPath,
                timestamp,
              },
            ],
            relatedDecisions: [],
            factors: {
              boundaryViolation: 0.95,
              dependencyChange: 0.70,
            },
          });
        }
      }

      // Check Directory Structure Drift
      if (srcPath.includes('/temp/') || srcPath.includes('/scratch/')) {
        findings.push({
          type: 'DIRECTORY_STRUCTURE_DRIFT',
          title: `Directory Structure Drift (${srcPath})`,
          summary: `File '${srcPath}' is located in a scratch/temporary directory outside standard package conventions.`,
          affectedFiles: [srcPath],
          affectedSymbols: [srcNode.id],
          affectedPackages: srcPkg ? [srcPkg] : [],
          baselineEvidence: [
            {
              id: `ev_base_dir`,
              source: 'architectural-baseline',
              description: 'All production code must be inside standard package /src directory.',
              expectedValue: 'packages/*/src',
              timestamp,
            },
          ],
          currentEvidence: [
            {
              id: `ev_curr_dir_${srcNode.id}`,
              source: 'symbol-graph',
              description: `Non-standard directory path: ${srcPath}`,
              observedValue: srcPath,
              timestamp,
            },
          ],
          relatedDecisions: [],
          factors: {
            boundaryViolation: 0.60,
            historicalDeviation: 0.65,
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
    return null;
  }
}
