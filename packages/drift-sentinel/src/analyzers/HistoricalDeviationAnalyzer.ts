import { SymbolGraph } from '@codememory/symbol-graph';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';
import { RawDriftFindingInput } from './DependencyDirectionAnalyzer.js';

export class HistoricalDeviationAnalyzer {
  public analyze(graph: SymbolGraph, baseline: ArchitecturalBaseline): RawDriftFindingInput[] {
    const findings: RawDriftFindingInput[] = [];
    const timestamp = new Date().toISOString();

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    // 1. Symbol Responsibility Drift
    const callCountMap = new Map<string, number>();
    edges.forEach((e) => {
      callCountMap.set(e.toId, (callCountMap.get(e.toId) ?? 0) + 1);
    });

    const baselineRespMap = new Map(baseline.symbolResponsibilities.map((r) => [r.symbolId, r]));

    for (const node of nodes) {
      const currentCalls = callCountMap.get(node.id) ?? 0;
      const base = baselineRespMap.get(node.id);
      const filePath = node.location?.filePath ?? (node as any).filePath ?? '';

      if (base && currentCalls > base.callCount + 5) {
        findings.push({
          type: 'SYMBOL_RESPONSIBILITY_DRIFT',
          title: `Symbol Responsibility Drift (${node.name})`,
          summary: `Symbol '${node.name}' accumulated ${currentCalls} referencing call sites (historical baseline: ${base.callCount}).`,
          affectedFiles: [filePath],
          affectedSymbols: [node.id],
          affectedPackages: [],
          baselineEvidence: [
            {
              id: `ev_base_resp_${node.id}`,
              source: 'architectural-baseline',
              description: `Baseline call count: ${base.callCount}`,
              expectedValue: base.callCount,
              timestamp,
            },
          ],
          currentEvidence: [
            {
              id: `ev_curr_resp_${node.id}`,
              source: 'symbol-graph',
              description: `Current referencing call sites: ${currentCalls}`,
              observedValue: currentCalls,
              timestamp,
            },
          ],
          relatedDecisions: [],
          factors: {
            historicalDeviation: 0.80,
            relationshipChange: 0.70,
          },
        });
      }
    }

    // 2. Hotspot Escalation
    for (const hotspotPkg of baseline.knownHotspots) {
      const hotspotEdges = edges.filter((e) => {
        const srcNode = nodes.find((n) => n.id === e.fromId);
        const tgtNode = nodes.find((n) => n.id === e.toId);
        const srcPath = srcNode?.location?.filePath ?? (srcNode as any)?.filePath ?? '';
        const tgtPath = tgtNode?.location?.filePath ?? (tgtNode as any)?.filePath ?? '';
        return srcPath.includes(hotspotPkg) || tgtPath.includes(hotspotPkg);
      });

      if (hotspotEdges.length >= 10) {
        findings.push({
          type: 'HOTSPOT_ESCALATION',
          title: `Hotspot Escalation (${hotspotPkg})`,
          summary: `Historically risky hotspot component '${hotspotPkg}' reached ${hotspotEdges.length} active edge connections.`,
          affectedFiles: Array.from(new Set(hotspotEdges.map((e) => {
            const srcNode = nodes.find((n) => n.id === e.fromId);
            return srcNode?.location?.filePath ?? (srcNode as any)?.filePath;
          }).filter(Boolean) as string[])),
          affectedSymbols: [],
          affectedPackages: [hotspotPkg],
          baselineEvidence: [
            {
              id: `ev_base_hotspot_${hotspotPkg}`,
              source: 'architectural-baseline',
              description: `Component '${hotspotPkg}' flagged as high-risk architectural hotspot.`,
              expectedValue: 'Low edge complexity',
              timestamp,
            },
          ],
          currentEvidence: [
            {
              id: `ev_curr_hotspot_${hotspotPkg}`,
              source: 'symbol-graph',
              description: `Active graph edge connections: ${hotspotEdges.length}`,
              observedValue: hotspotEdges.length,
              timestamp,
            },
          ],
          relatedDecisions: [],
          factors: {
            historicalDeviation: 0.85,
            couplingIncrease: 0.75,
          },
        });
      }
    }

    return findings;
  }
}
