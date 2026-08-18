import { SymbolGraph } from '@codememory/symbol-graph';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';
import { RawDriftFindingInput } from './DependencyDirectionAnalyzer.js';

export class CouplingAnalyzer {
  public analyze(graph: SymbolGraph, baseline: ArchitecturalBaseline): RawDriftFindingInput[] {
    const findings: RawDriftFindingInput[] = [];
    const timestamp = new Date().toISOString();

    const currentMetrics = this.calculateCoupling(graph);
    const baselineMap = new Map(baseline.couplingMetrics.map((m) => [m.modulePath, m]));

    for (const [modulePath, curr] of currentMetrics.entries()) {
      const base = baselineMap.get(modulePath);
      if (!base) continue;

      const edgeIncrease = (curr.inboundEdgesCount + curr.outboundEdgesCount) - (base.inboundEdgesCount + base.outboundEdgesCount);

      if (edgeIncrease >= 5 || curr.couplingRatio > base.couplingRatio * 2.0) {
        findings.push({
          type: 'COUPLING_INCREASE',
          title: `Significant Coupling Escalation (${modulePath})`,
          summary: `Module '${modulePath}' coupling ratio increased from ${base.couplingRatio} to ${curr.couplingRatio} (+${edgeIncrease} edges).`,
          affectedFiles: [modulePath],
          affectedSymbols: [],
          affectedPackages: [],
          baselineEvidence: [
            {
              id: `ev_base_coup_${modulePath}`,
              source: 'architectural-baseline',
              description: `Baseline coupling ratio: ${base.couplingRatio} (Edges: ${base.inboundEdgesCount + base.outboundEdgesCount})`,
              expectedValue: base.couplingRatio,
              timestamp,
            },
          ],
          currentEvidence: [
            {
              id: `ev_curr_coup_${modulePath}`,
              source: 'symbol-graph',
              description: `Current coupling ratio: ${curr.couplingRatio} (Edges: ${curr.inboundEdgesCount + curr.outboundEdgesCount})`,
              observedValue: curr.couplingRatio,
              timestamp,
            },
          ],
          relatedDecisions: [],
          factors: {
            couplingIncrease: 0.85,
            relationshipChange: 0.70,
          },
        });
      }
    }

    return findings;
  }

  public calculateCoupling(graph: SymbolGraph): Map<string, { inboundEdgesCount: number; outboundEdgesCount: number; couplingRatio: number }> {
    const metrics = new Map<string, { inboundEdgesCount: number; outboundEdgesCount: number; couplingRatio: number }>();
    const nodesMap = new Map(graph.getAllNodes().map((n) => [n.id, n.location?.filePath ?? (n as any).filePath ?? '']));

    const inbound: Record<string, number> = {};
    const outbound: Record<string, number> = {};

    for (const edge of graph.getAllEdges()) {
      const srcFile = nodesMap.get(edge.fromId);
      const tgtFile = nodesMap.get(edge.toId);

      if (srcFile && tgtFile && srcFile !== tgtFile) {
        outbound[srcFile] = (outbound[srcFile] ?? 0) + 1;
        inbound[tgtFile] = (inbound[tgtFile] ?? 0) + 1;
      }
    }

    const allFiles = new Set([...Object.keys(inbound), ...Object.keys(outbound)]);
    for (const file of allFiles) {
      const inC = inbound[file] ?? 0;
      const outC = outbound[file] ?? 0;
      const ratio = outC === 0 ? inC : Number((inC / outC).toFixed(2));

      metrics.set(file, {
        inboundEdgesCount: inC,
        outboundEdgesCount: outC,
        couplingRatio: ratio,
      });
    }

    return metrics;
  }
}
