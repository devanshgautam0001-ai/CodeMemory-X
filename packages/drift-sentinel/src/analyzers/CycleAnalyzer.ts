import { SymbolGraph } from '@codememory/symbol-graph';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';
import { RawDriftFindingInput } from './DependencyDirectionAnalyzer.js';

export class CycleAnalyzer {
  public analyze(graph: SymbolGraph, baseline: ArchitecturalBaseline): RawDriftFindingInput[] {
    const findings: RawDriftFindingInput[] = [];
    const timestamp = new Date().toISOString();

    const cycles = this.findDependencyCycles(graph);

    for (const cycle of cycles) {
      // Check if cycle is already known in baseline
      const cycleKey = cycle.sort().join('->');
      const isKnown = baseline.knownCycles.some((kc) => kc.sort().join('->') === cycleKey);

      if (!isKnown) {
        findings.push({
          type: 'NEW_CYCLIC_DEPENDENCY',
          title: `New Cyclic Dependency Detected (${cycle.length} nodes)`,
          summary: `A circular dependency chain was introduced: ${cycle.join(' → ')} → ${cycle[0]}`,
          affectedFiles: cycle,
          affectedSymbols: [],
          affectedPackages: Array.from(new Set(cycle.map((f) => this.extractPackageName(f)).filter(Boolean) as string[])),
          baselineEvidence: [
            {
              id: `ev_base_cycles`,
              source: 'architectural-baseline',
              description: `Baseline had ${baseline.knownCycles.length} known cycles.`,
              expectedValue: 0,
              timestamp,
            },
          ],
          currentEvidence: [
            {
              id: `ev_curr_cycle_${cycleKey}`,
              source: 'symbol-graph',
              description: `Cycle path: ${cycle.join(' -> ')}`,
              observedValue: cycle,
              timestamp,
            },
          ],
          relatedDecisions: [],
          factors: {
            boundaryViolation: 0.85,
            dependencyChange: 0.90,
          },
        });
      }
    }

    return findings;
  }

  public findDependencyCycles(graph: SymbolGraph): string[][] {
    const adjacency = new Map<string, Set<string>>();
    const nodesMap = new Map(graph.getAllNodes().map((n) => [n.id, n.location?.filePath ?? (n as any).filePath ?? '']));

    for (const edge of graph.getAllEdges()) {
      const srcFile = nodesMap.get(edge.fromId) ?? edge.fromId;
      const tgtFile = nodesMap.get(edge.toId) ?? edge.toId;

      if (srcFile === tgtFile) continue;

      if (!adjacency.has(srcFile)) adjacency.set(srcFile, new Set());
      adjacency.get(srcFile)!.add(tgtFile);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (curr: string, path: string[]) => {
      visited.add(curr);
      recStack.add(curr);
      path.push(curr);

      const neighbors = adjacency.get(curr) ?? new Set();
      for (const next of neighbors) {
        if (!visited.has(next)) {
          dfs(next, [...path]);
        } else if (recStack.has(next)) {
          const cycleStartIdx = path.indexOf(next);
          if (cycleStartIdx !== -1) {
            cycles.push(path.slice(cycleStartIdx));
          }
        }
      }

      recStack.delete(curr);
    };

    for (const node of adjacency.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  private extractPackageName(filePath: string): string | null {
    if (filePath.includes('packages/')) {
      const parts = filePath.split('packages/')[1].split('/');
      return `@codememory/${parts[0]}`;
    }
    return null;
  }
}
