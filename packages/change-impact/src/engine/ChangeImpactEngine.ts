import { ILogger } from '@codememory/logging';
import { SymbolGraph } from '@codememory/symbol-graph';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { ConfidenceEngine } from '@codememory/confidence-engine';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { InMemoryEventBus } from '@codememory/event-bus';

import { ImpactMap } from '../types/ImpactMap.js';
import { ImpactNode } from '../types/ImpactNode.js';
import { ImpactEdge } from '../types/ImpactEdge.js';
import { ChangeInput } from '../types/ChangeInput.js';

import { ImpactScorer } from '../scoring/ImpactScorer.js';
import { DistanceDecay } from '../scoring/DistanceDecay.js';
import { CoChangeIndex } from '../index/CoChangeIndex.js';
import { ImpactRepository } from '../repository/ImpactRepository.js';

import { DependencyImpactAnalyzer } from '../analyzers/DependencyImpactAnalyzer.js';
import { CallerImpactAnalyzer } from '../analyzers/CallerImpactAnalyzer.js';
import { ReferenceImpactAnalyzer } from '../analyzers/ReferenceImpactAnalyzer.js';
import { InheritanceImpactAnalyzer } from '../analyzers/InheritanceImpactAnalyzer.js';
import { FileImpactAnalyzer } from '../analyzers/FileImpactAnalyzer.js';
import { MemoryImpactAnalyzer } from '../analyzers/MemoryImpactAnalyzer.js';
import { HistoricalCoChangeAnalyzer } from '../analyzers/HistoricalCoChangeAnalyzer.js';
import { ArchitecturalImpactAnalyzer } from '../analyzers/ArchitecturalImpactAnalyzer.js';

export interface EngineDependencies {
  symbolGraph?: SymbolGraph;
  memoryQueryEngine?: MemoryQueryEngine;
  confidenceEngine?: ConfidenceEngine;
  driftSentinel?: DriftSentinel;
  eventBus?: InMemoryEventBus;
}

export class ChangeImpactEngine {
  private scorer: ImpactScorer;
  private coChangeIndex: CoChangeIndex;
  private repo: ImpactRepository;

  private depAnalyzer: DependencyImpactAnalyzer;
  private callerAnalyzer: CallerImpactAnalyzer;
  private refAnalyzer: ReferenceImpactAnalyzer;
  private inhAnalyzer: InheritanceImpactAnalyzer;
  private fileAnalyzer: FileImpactAnalyzer;
  private memAnalyzer: MemoryImpactAnalyzer;
  private cochangeAnalyzer: HistoricalCoChangeAnalyzer;
  private archAnalyzer: ArchitecturalImpactAnalyzer;

  constructor(
    private readonly deps: EngineDependencies = {},
    private readonly logger?: ILogger
  ) {
    this.scorer = new ImpactScorer(new DistanceDecay());
    this.coChangeIndex = new CoChangeIndex();
    this.repo = new ImpactRepository();

    this.depAnalyzer = new DependencyImpactAnalyzer();
    this.callerAnalyzer = new CallerImpactAnalyzer();
    this.refAnalyzer = new ReferenceImpactAnalyzer();
    this.inhAnalyzer = new InheritanceImpactAnalyzer();
    this.fileAnalyzer = new FileImpactAnalyzer();
    this.memAnalyzer = new MemoryImpactAnalyzer();
    this.cochangeAnalyzer = new HistoricalCoChangeAnalyzer();
    this.archAnalyzer = new ArchitecturalImpactAnalyzer();
  }

  public indexHistoricalCommit(changedFiles: string[]): void {
    this.coChangeIndex.indexCommit(changedFiles);
  }

  public analyzeSymbol(symbolId: string, maxDepth = 3): ImpactMap {
    this.logger?.info(`[ChangeImpactEngine] Analyzing impact for symbol ${symbolId}`);
    return this.runImpactBfs(symbolId, 'SYMBOL', maxDepth);
  }

  public analyzeFile(filePath: string, maxDepth = 3): ImpactMap {
    this.logger?.info(`[ChangeImpactEngine] Analyzing impact for file ${filePath}`);
    return this.runImpactBfs(filePath, 'FILE', maxDepth);
  }

  public analyzePackage(packageName: string, maxDepth = 3): ImpactMap {
    this.logger?.info(`[ChangeImpactEngine] Analyzing impact for package ${packageName}`);
    return this.runImpactBfs(packageName, 'PACKAGE', maxDepth);
  }

  public analyzeChange(change: ChangeInput, maxDepth = 3): ImpactMap {
    if (change.changedSymbols && change.changedSymbols.length > 0) {
      return this.analyzeSymbol(change.changedSymbols[0], maxDepth);
    }
    const rootFile = change.changedFiles[0] ?? 'workspace';
    return this.analyzeFile(rootFile, maxDepth);
  }

  public getImpactMap(rootId: string): ImpactMap | undefined {
    return this.repo.getByRootId(rootId);
  }

  public getAffectedSymbols(rootId: string): ImpactNode[] {
    const map = this.repo.getByRootId(rootId);
    if (!map) return [];
    return map.nodes.filter((n) => n.entityType === 'SYMBOL');
  }

  public getAffectedFiles(rootId: string): ImpactNode[] {
    const map = this.repo.getByRootId(rootId);
    if (!map) return [];
    return map.nodes.filter((n) => n.entityType === 'FILE');
  }

  public getAffectedPackages(rootId: string): ImpactNode[] {
    const map = this.repo.getByRootId(rootId);
    if (!map) return [];
    return map.nodes.filter((n) => n.entityType === 'PACKAGE');
  }

  public getRelatedDecisions(rootId: string): ImpactNode[] {
    const map = this.repo.getByRootId(rootId);
    if (!map) return [];
    return map.nodes.filter((n) => n.entityType === 'DECISION');
  }

  public getRelatedBugs(rootId: string): ImpactNode[] {
    const map = this.repo.getByRootId(rootId);
    if (!map) return [];
    return map.nodes.filter((n) => n.entityType === 'BUG');
  }

  public getRelatedRefactors(rootId: string): ImpactNode[] {
    const map = this.repo.getByRootId(rootId);
    if (!map) return [];
    return map.nodes.filter((n) => n.entityType === 'REFACTOR');
  }

  public getHighImpactEntities(rootId: string, threshold = 0.60): ImpactNode[] {
    const map = this.repo.getByRootId(rootId);
    if (!map) return [];
    return map.nodes.filter((n) => n.impactScore >= threshold);
  }

  public clear(): void {
    this.coChangeIndex.clear();
    this.repo.clear();
  }

  private runImpactBfs(rootId: string, rootType: string, maxDepth: number): ImpactMap {
    const visited = new Set<string>();
    const nodeMap = new Map<string, ImpactNode>();
    const edgeMap = new Map<string, ImpactEdge>();

    const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }];
    visited.add(rootId);

    // Self Root Node
    nodeMap.set(rootId, {
      id: rootId,
      entityType: rootType as any,
      name: rootId.split('/').pop() ?? rootId,
      path: rootId.includes('/') ? rootId : undefined,
      impactScore: 1.0,
      confidence: 1.0,
      reasons: [],
      distance: 0,
    });

    let currentMaxDepth = 0;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      currentMaxDepth = Math.max(currentMaxDepth, curr.depth);

      if (curr.depth >= maxDepth) continue;

      const nextDistance = curr.depth + 1;
      const discovered: { nodes: ImpactNode[]; edges: ImpactEdge[] }[] = [];

      if (this.deps.symbolGraph) {
        discovered.push(this.depAnalyzer.analyze(curr.id, this.deps.symbolGraph, this.scorer, nextDistance));
        discovered.push(this.callerAnalyzer.analyze(curr.id, this.deps.symbolGraph, this.scorer, nextDistance));
        discovered.push(this.refAnalyzer.analyze(curr.id, this.deps.symbolGraph, this.scorer, nextDistance));
        discovered.push(this.inhAnalyzer.analyze(curr.id, this.deps.symbolGraph, this.scorer, nextDistance));
        discovered.push(this.fileAnalyzer.analyze(curr.id, this.deps.symbolGraph, this.scorer, nextDistance));
      }

      if (this.deps.memoryQueryEngine) {
        discovered.push(this.memAnalyzer.analyze(curr.id, this.deps.memoryQueryEngine, this.scorer, nextDistance));
      }

      discovered.push(this.cochangeAnalyzer.analyze(curr.id, this.coChangeIndex, this.scorer, nextDistance));

      if (this.deps.driftSentinel) {
        discovered.push(this.archAnalyzer.analyze(curr.id, this.deps.driftSentinel, this.scorer, nextDistance));
      }

      for (const group of discovered) {
        for (const edge of group.edges) {
          if (!edgeMap.has(edge.id)) {
            edgeMap.set(edge.id, edge);
          }
        }

        for (const node of group.nodes) {
          if (node.id === rootId) continue;

          if (!nodeMap.has(node.id)) {
            nodeMap.set(node.id, node);
          } else {
            // Merge reasons and update max impact score
            const existing = nodeMap.get(node.id)!;
            existing.reasons.push(...node.reasons);
            existing.impactScore = Math.max(existing.impactScore, node.impactScore);
          }

          if (!visited.has(node.id)) {
            visited.add(node.id);
            queue.push({ id: node.id, depth: nextDistance });
          }
        }
      }
    }

    // Sort nodes and edges deterministically by ID
    const nodes = Array.from(nodeMap.values()).sort((a, b) => a.id.localeCompare(b.id));
    const edges = Array.from(edgeMap.values()).sort((a, b) => a.id.localeCompare(b.id));

    const totalAffectedEntities = Math.max(0, nodes.length - 1); // exclude root
    const avgScore = nodes.length > 0 ? Number((nodes.reduce((s, n) => s + n.impactScore, 0) / nodes.length).toFixed(4)) : 0;
    const avgConf = nodes.length > 0 ? Number((nodes.reduce((s, n) => s + n.confidence, 0) / nodes.length).toFixed(4)) : 0;
    const timestamp = new Date().toISOString();

    const resultMap: ImpactMap = {
      rootId,
      rootType,
      nodes,
      edges,
      totalAffectedEntities,
      maximumDepth: currentMaxDepth,
      overallImpactScore: avgScore,
      overallConfidence: avgConf,
      generatedAt: timestamp,
    };

    this.repo.save(resultMap);

    if (this.deps.eventBus) {
      this.deps.eventBus.publish({
        id: `evt_imp_${rootId}_${Date.now()}`,
        type: 'CHANGE_IMPACT_ANALYZED',
        timestamp,
        payload: {
          rootId,
          totalAffectedEntities,
          maximumDepth: currentMaxDepth,
          overallImpactScore: avgScore,
          overallConfidence: avgConf,
          generatedAt: timestamp,
        },
      } as any);
    }

    return resultMap;
  }
}
