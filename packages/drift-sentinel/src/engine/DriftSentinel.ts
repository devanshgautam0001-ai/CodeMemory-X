import { ILogger } from '@codememory/logging';
import { SymbolGraph } from '@codememory/symbol-graph';
import { BaseMemory } from '@codememory/memory-engine';
import { RelationshipEngine } from '@codememory/relationship-engine';
import { ConfidenceEngine } from '@codememory/confidence-engine';
import { InMemoryEventBus } from '@codememory/event-bus';

import { DriftFinding } from '../types/DriftFinding.js';
import { DriftType, DriftSeverity } from '../types/DriftTypes.js';
import { ArchitecturalBaseline } from '../types/ArchitecturalBaseline.js';

import { ArchitecturalBaselineBuilder, BaselineBuilderInputs } from '../baseline/ArchitecturalBaselineBuilder.js';
import { BaselineRepository } from '../baseline/BaselineRepository.js';
import { DriftRepository } from '../repository/DriftRepository.js';

import { DependencyDirectionAnalyzer } from '../analyzers/DependencyDirectionAnalyzer.js';
import { CycleAnalyzer } from '../analyzers/CycleAnalyzer.js';
import { CouplingAnalyzer } from '../analyzers/CouplingAnalyzer.js';
import { BoundaryAnalyzer } from '../analyzers/BoundaryAnalyzer.js';
import { DecisionViolationAnalyzer } from '../analyzers/DecisionViolationAnalyzer.js';
import { HistoricalDeviationAnalyzer } from '../analyzers/HistoricalDeviationAnalyzer.js';
import { RelationshipDriftAnalyzer } from '../analyzers/RelationshipDriftAnalyzer.js';

import { DriftScorer } from '../scoring/DriftScorer.js';
import { SeverityResolver } from '../scoring/SeverityResolver.js';

export interface AnalysisInputs {
  symbolGraph?: SymbolGraph;
  memories?: BaseMemory[];
  relationshipEngine?: RelationshipEngine;
}

export class DriftSentinel {
  private baselineBuilder: ArchitecturalBaselineBuilder;
  private baselineRepo: BaselineRepository;
  private driftRepo: DriftRepository;

  private depDirectionAnalyzer: DependencyDirectionAnalyzer;
  private cycleAnalyzer: CycleAnalyzer;
  private couplingAnalyzer: CouplingAnalyzer;
  private boundaryAnalyzer: BoundaryAnalyzer;
  private decisionAnalyzer: DecisionViolationAnalyzer;
  private historicalAnalyzer: HistoricalDeviationAnalyzer;
  private relationshipAnalyzer: RelationshipDriftAnalyzer;

  private scorer: DriftScorer;
  private severityResolver: SeverityResolver;
  private confidenceEngine: ConfidenceEngine;

  constructor(
    private readonly eventBus?: InMemoryEventBus,
    private readonly logger?: ILogger
  ) {
    this.baselineBuilder = new ArchitecturalBaselineBuilder(this.logger);
    this.baselineRepo = new BaselineRepository();
    this.driftRepo = new DriftRepository();

    this.depDirectionAnalyzer = new DependencyDirectionAnalyzer();
    this.cycleAnalyzer = new CycleAnalyzer();
    this.couplingAnalyzer = new CouplingAnalyzer();
    this.boundaryAnalyzer = new BoundaryAnalyzer();
    this.decisionAnalyzer = new DecisionViolationAnalyzer();
    this.historicalAnalyzer = new HistoricalDeviationAnalyzer();
    this.relationshipAnalyzer = new RelationshipDriftAnalyzer();

    this.scorer = new DriftScorer();
    this.severityResolver = new SeverityResolver();
    this.confidenceEngine = new ConfidenceEngine(this.logger);
  }

  public buildBaseline(inputs: BaselineBuilderInputs): ArchitecturalBaseline {
    const baseline = this.baselineBuilder.build(inputs);
    this.baselineRepo.save(baseline);
    this.logger?.info('[DriftSentinel] Built baseline with hash', { hash: baseline.hash });
    return baseline;
  }

  public analyze(inputs: AnalysisInputs): DriftFinding[] {
    let baseline = this.baselineRepo.getActive();
    if (!baseline) {
      baseline = this.buildBaseline(inputs);
    }

    const rawFindings = [];
    const timestamp = new Date().toISOString();

    if (inputs.symbolGraph) {
      rawFindings.push(...this.depDirectionAnalyzer.analyze(inputs.symbolGraph, baseline));
      rawFindings.push(...this.cycleAnalyzer.analyze(inputs.symbolGraph, baseline));
      rawFindings.push(...this.couplingAnalyzer.analyze(inputs.symbolGraph, baseline));
      rawFindings.push(...this.boundaryAnalyzer.analyze(inputs.symbolGraph, baseline));
      rawFindings.push(...this.historicalAnalyzer.analyze(inputs.symbolGraph, baseline));

      if (inputs.memories) {
        rawFindings.push(...this.decisionAnalyzer.analyze(inputs.symbolGraph, inputs.memories, baseline));
      }
    }

    if (inputs.relationshipEngine) {
      rawFindings.push(...this.relationshipAnalyzer.analyze(inputs.relationshipEngine, baseline));
    }

    const findings: DriftFinding[] = [];

    for (const rf of rawFindings) {
      const score = this.scorer.calculateScore(rf.factors);
      const severity = this.severityResolver.resolve(score);

      // Evaluate detection confidence deterministically using ConfidenceEngine
      const confRes = this.confidenceEngine.calculateConfidence({
        entityId: `drift_${rf.type}`,
        entityType: 'DriftFinding',
        sources: ['drift-sentinel', ...rf.baselineEvidence.map((e) => e.source)],
        timestamp,
        occurrenceCount: 1,
        relationshipCount: rf.affectedFiles.length + rf.affectedSymbols.length,
        hasValidAst: true,
        hasLocationInfo: rf.affectedFiles.length > 0,
      });

      const findingId = `drift_${rf.type}_${this.simpleHash(rf.title + rf.summary)}`;

      // Prevent duplicate findings
      if (!this.driftRepo.getById(findingId)) {
        const finding: DriftFinding = {
          id: findingId,
          type: rf.type,
          severity,
          score,
          title: rf.title,
          summary: rf.summary,
          affectedFiles: rf.affectedFiles,
          affectedSymbols: rf.affectedSymbols,
          affectedPackages: rf.affectedPackages,
          baselineEvidence: rf.baselineEvidence,
          currentEvidence: rf.currentEvidence,
          relatedDecisions: rf.relatedDecisions,
          relatedMemories: [],
          confidence: confRes.score,
          detectedAt: timestamp,
          acknowledged: false,
        };

        this.driftRepo.save(finding);
        findings.push(finding);

        // Publish event to EventBus without event loops
        if (this.eventBus) {
          this.eventBus.publish({
            id: `evt_drift_${finding.id}`,
            type: 'ARCHITECTURAL_DRIFT_DETECTED',
            timestamp: finding.detectedAt,
            payload: {
              findingId: finding.id,
              type: finding.type,
              severity: finding.severity,
              score: finding.score,
              confidence: finding.confidence,
              affectedFiles: finding.affectedFiles,
              affectedSymbols: finding.affectedSymbols,
              affectedPackages: finding.affectedPackages,
              detectedAt: finding.detectedAt,
            },
          } as any);
        }
      }
    }

    return findings;
  }

  public analyzeDependencyGraph(graph: SymbolGraph): DriftFinding[] {
    return this.analyze({ symbolGraph: graph });
  }

  public findDrift(): DriftFinding[] {
    return this.driftRepo.getAll();
  }

  public findAllDrift(): DriftFinding[] {
    return this.driftRepo.getAll();
  }

  public getFinding(id: string): DriftFinding | undefined {
    return this.driftRepo.getById(id);
  }

  public getFindingsBySeverity(severity: DriftSeverity): DriftFinding[] {
    return this.driftRepo.getBySeverity(severity);
  }

  public getFindingsByType(type: DriftType): DriftFinding[] {
    return this.driftRepo.getByType(type);
  }

  public getFindingsForFile(filePath: string): DriftFinding[] {
    return this.driftRepo.getForFile(filePath);
  }

  public getFindingsForSymbol(symbolId: string): DriftFinding[] {
    return this.driftRepo.getForSymbol(symbolId);
  }

  public getFindingsForPackage(packageName: string): DriftFinding[] {
    return this.driftRepo.getForPackage(packageName);
  }

  public acknowledgeFinding(id: string): boolean {
    return this.driftRepo.acknowledge(id);
  }

  public clear(): void {
    this.baselineRepo.clear();
    this.driftRepo.clear();
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}
