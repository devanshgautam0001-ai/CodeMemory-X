import { SymbolGraph } from '@codememory/symbol-graph';
import { BaseMemory } from '@codememory/memory-engine';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';
import { RawDriftFindingInput } from './DependencyDirectionAnalyzer.js';

export class DecisionViolationAnalyzer {
  public analyze(
    graph: SymbolGraph,
    memories: BaseMemory[],
    _baseline: ArchitecturalBaseline
  ): RawDriftFindingInput[] {
    const findings: RawDriftFindingInput[] = [];
    const timestamp = new Date().toISOString();

    const decisionMemories = memories.filter((m) => m.type === 'decision');
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    const nodesMap = new Map(nodes.map((n) => [n.id, n]));

    for (const decMem of decisionMemories) {
      const decId = decMem.id;
      const title = (decMem as any).decisionTitle ?? decMem.summary;
      const rationale = ((decMem as any).rationale ?? (decMem as any).metadata?.rationale ?? decMem.summary ?? '').toLowerCase();

      // Check if ADR restricts specific package/module dependencies (e.g., "Storage must remain isolated behind IStoragePort")
      for (const edge of edges) {
        const srcNode = nodesMap.get(edge.fromId);
        const tgtNode = nodesMap.get(edge.toId);

        if (!srcNode || !tgtNode) continue;

        const srcPath = srcNode.location?.filePath ?? (srcNode as any).filePath ?? '';
        const tgtPath = tgtNode.location?.filePath ?? (tgtNode as any).filePath ?? '';

        const combinedText = `${srcPath} -> ${tgtPath}`.toLowerCase();

        const isViolation =
          (rationale.includes('isolate') && rationale.includes('storage') && combinedText.includes('storage') && !combinedText.includes('istorageport')) ||
          (rationale.includes('no git writes') && combinedText.includes('git') && combinedText.includes('write')) ||
          (rationale.includes('wasm sqlite') && combinedText.includes('postgres'));

        if (isViolation) {
          findings.push({
            type: 'ARCHITECTURAL_DECISION_VIOLATION',
            title: `Architectural Decision Violation (${title})`,
            summary: `Code relationship ${srcPath} → ${tgtPath} conflicts with accepted Architectural Decision '${title}' (${decId}).`,
            affectedFiles: [srcPath, tgtPath],
            affectedSymbols: [srcNode.id, tgtNode.id],
            affectedPackages: [],
            baselineEvidence: [
              {
                id: `ev_adr_${decId}`,
                source: 'adr-decision',
                description: `Accepted ADR Constraint: "${title}" (${decMem.summary})`,
                expectedValue: decMem.summary,
                timestamp,
              },
            ],
            currentEvidence: [
              {
                id: `ev_curr_adr_viol_${edge.id}`,
                source: 'symbol-graph',
                description: `Disallowed graph connection: ${srcPath} -> ${tgtPath}`,
                observedValue: `${srcPath} -> ${tgtPath}`,
                timestamp,
              },
            ],
            relatedDecisions: [decId],
            factors: {
              decisionConflict: 1.0,
              boundaryViolation: 0.80,
            },
          });
        }
      }
    }

    return findings;
  }
}
