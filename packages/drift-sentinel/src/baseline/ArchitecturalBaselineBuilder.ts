import { ILogger } from '@codememory/logging';
import { BaseMemory } from '@codememory/memory-engine';
import { SymbolGraph } from '@codememory/symbol-graph';
import { RelationshipEngine } from '@codememory/relationship-engine';
import {
  ArchitecturalBaseline,
  PackageDependencyRule,
  ModuleCouplingMetric,
  SymbolResponsibilityMetric,
  ArchitecturalDecisionConstraint,
} from '../types/ArchitecturalBaseline.js';

export interface BaselineBuilderInputs {
  symbolGraph?: SymbolGraph;
  memories?: BaseMemory[];
  relationshipEngine?: RelationshipEngine;
  knownRules?: PackageDependencyRule[];
}

export class ArchitecturalBaselineBuilder {
  constructor(private readonly logger?: ILogger) {}

  public build(inputs: BaselineBuilderInputs): ArchitecturalBaseline {
    this.logger?.info('[ArchitecturalBaselineBuilder] Generating deterministic baseline...');

    const memories = inputs.memories ?? [];
    const symbolGraph = inputs.symbolGraph;

    // 1. Build Package Dependencies Rules from Inputs / Defaults
    const packageDependencies: PackageDependencyRule[] = inputs.knownRules ?? [
      {
        packageName: '@codememory/core',
        allowedDependencies: ['@codememory/shared', '@codememory/logging'],
        disallowedDependencies: ['@codememory/memory-engine', '@codememory/context-engine'],
      },
      {
        packageName: '@codememory/memory-engine',
        allowedDependencies: ['@codememory/core', '@codememory/shared', '@codememory/event-store', '@codememory/event-bus', '@codememory/logging'],
        disallowedDependencies: ['@codememory/context-engine', '@codememory/memory-query'],
      },
      {
        packageName: '@codememory/memory-query',
        allowedDependencies: ['@codememory/memory-engine', '@codememory/core', '@codememory/shared', '@codememory/logging'],
        disallowedDependencies: ['@codememory/context-engine'],
      },
      {
        packageName: '@codememory/context-engine',
        allowedDependencies: ['@codememory/memory-query', '@codememory/core', '@codememory/shared', '@codememory/logging'],
        disallowedDependencies: ['@codememory/git-engine', '@codememory/workspace-watcher'],
      },
    ];

    // 2. Allowed Import Directions
    const allowedImportDirections: Record<string, string[]> = {
      'context-engine': ['memory-query', 'core', 'shared', 'logging'],
      'memory-query': ['memory-engine', 'core', 'shared', 'logging'],
      'memory-engine': ['event-store', 'event-bus', 'core', 'shared', 'logging'],
      'core': ['shared', 'logging'],
    };

    // 3. Module Coupling Metrics
    const couplingMetrics: ModuleCouplingMetric[] = [];
    if (symbolGraph) {
      const nodes = symbolGraph.getAllNodes();
      const edges = symbolGraph.getAllEdges();

      const inboundCount: Record<string, number> = {};
      const outboundCount: Record<string, number> = {};

      edges.forEach((edge) => {
        outboundCount[edge.fromId] = (outboundCount[edge.fromId] ?? 0) + 1;
        inboundCount[edge.toId] = (inboundCount[edge.toId] ?? 0) + 1;
      });

      nodes.forEach((node) => {
        const inC = inboundCount[node.id] ?? 0;
        const outC = outboundCount[node.id] ?? 0;
        const ratio = outC === 0 ? inC : Number((inC / outC).toFixed(2));
        const filePath = node.location?.filePath ?? (node as any).filePath ?? '';

        couplingMetrics.push({
          modulePath: filePath,
          inboundEdgesCount: inC,
          outboundEdgesCount: outC,
          couplingRatio: ratio,
        });
      });
    }

    // 4. Symbol Responsibility Metrics
    const symbolResponsibilities: SymbolResponsibilityMetric[] = [];
    if (symbolGraph) {
      symbolGraph.getAllNodes().forEach((node) => {
        symbolResponsibilities.push({
          symbolId: node.id,
          symbolName: node.name,
          referencingFilesCount: 1,
          callCount: 1,
        });
      });
    }

    // 5. ADR Decision Constraints
    const decisionConstraints: ArchitecturalDecisionConstraint[] = [];
    memories
      .filter((m) => m.type === 'decision')
      .forEach((decMem: any) => {
        decisionConstraints.push({
          decisionId: decMem.id,
          title: decMem.decisionTitle ?? decMem.summary,
          restrictedPattern: decMem.rationale ?? '',
          affectedFiles: decMem.boundSymbols ?? [],
        });
      });

    // Sort deterministically to guarantee reproducible baseline hashing
    couplingMetrics.sort((a, b) => a.modulePath.localeCompare(b.modulePath));
    symbolResponsibilities.sort((a, b) => a.symbolId.localeCompare(b.symbolId));
    decisionConstraints.sort((a, b) => a.decisionId.localeCompare(b.decisionId));

    const deterministicContent = JSON.stringify({
      packageDependencies,
      allowedImportDirections,
      couplingMetrics,
      symbolResponsibilities,
      decisionConstraints,
    });

    const hash = `base_hash_${this.simpleStringHash(deterministicContent)}`;

    return {
      id: `baseline_${Date.now()}`,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      packageDependencies,
      allowedImportDirections,
      knownCycles: [],
      couplingMetrics,
      symbolResponsibilities,
      ownershipPatterns: [],
      decisionConstraints,
      knownHotspots: ['@codememory/memory-engine', '@codememory/event-store'],
      hash,
    };
  }

  private simpleStringHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}
