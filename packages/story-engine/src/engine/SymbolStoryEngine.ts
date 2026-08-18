import { ILogger } from '@codememory/logging';
import { InMemoryEventBus } from '@codememory/event-bus';
import { EventStore } from '@codememory/event-store';
import { SymbolGraph } from '@codememory/symbol-graph';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { ChangeImpactEngine } from '@codememory/change-impact';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';

import { SymbolStory } from '../types/SymbolStory.js';
import { StoryBirth } from '../types/StoryBirth.js';
import { StoryMilestone } from '../types/StoryMilestone.js';
import { StoryContributor } from '../types/StoryContributor.js';
import { StoryDecision } from '../types/StoryDecision.js';
import { StoryBug } from '../types/StoryBug.js';
import { StoryRefactor } from '../types/StoryRefactor.js';
import { StoryDependency } from '../types/StoryDependency.js';
import { StorySession } from '../types/StorySession.js';
import { StoryMetrics } from '../types/StoryMetrics.js';
import { StoryRiskPoint } from '../types/StoryRiskPoint.js';
import { StoryEvidence } from '../types/StoryEvidence.js';

import { StoryRepository } from '../repository/StoryRepository.js';
import { BirthExtractor } from '../extractors/BirthExtractor.js';
import { RenameMoveDetector } from '../extractors/RenameMoveDetector.js';
import { MilestoneExtractor } from '../extractors/MilestoneExtractor.js';
import { ContributorExtractor } from '../extractors/ContributorExtractor.js';
import { DecisionExtractor } from '../extractors/DecisionExtractor.js';
import { BugExtractor } from '../extractors/BugExtractor.js';
import { RefactorExtractor } from '../extractors/RefactorExtractor.js';
import { DependencyExtractor } from '../extractors/DependencyExtractor.js';
import { SessionHistoryExtractor } from '../extractors/SessionHistoryExtractor.js';
import { RiskHistoryExtractor } from '../extractors/RiskHistoryExtractor.js';

export interface StoryEngineDependencies {
  eventStore?: EventStore;
  symbolGraph?: SymbolGraph;
  memoryQueryEngine?: MemoryQueryEngine;
  driftSentinel?: DriftSentinel;
  changeImpactEngine?: ChangeImpactEngine;
  sessionEngine?: SessionIntelligenceEngine;
  eventBus?: InMemoryEventBus;
}

export class SymbolStoryEngine {
  private repo: StoryRepository;
  private birthExtractor: BirthExtractor;
  private renameDetector: RenameMoveDetector;
  private milestoneExtractor: MilestoneExtractor;
  private contributorExtractor: ContributorExtractor;
  private decisionExtractor: DecisionExtractor;
  private bugExtractor: BugExtractor;
  private refactorExtractor: RefactorExtractor;
  private dependencyExtractor: DependencyExtractor;
  private sessionExtractor: SessionHistoryExtractor;
  private riskExtractor: RiskHistoryExtractor;

  constructor(
    private readonly deps: StoryEngineDependencies = {},
    private readonly logger?: ILogger
  ) {
    this.repo = new StoryRepository();
    this.birthExtractor = new BirthExtractor();
    this.renameDetector = new RenameMoveDetector();
    this.milestoneExtractor = new MilestoneExtractor();
    this.contributorExtractor = new ContributorExtractor();
    this.decisionExtractor = new DecisionExtractor();
    this.bugExtractor = new BugExtractor();
    this.refactorExtractor = new RefactorExtractor();
    this.dependencyExtractor = new DependencyExtractor();
    this.sessionExtractor = new SessionHistoryExtractor();
    this.riskExtractor = new RiskHistoryExtractor();
  }

  public async getStory(symbolId: string, name?: string, filePath?: string): Promise<SymbolStory> {
    const cached = this.repo.getBySymbolId(symbolId);
    if (cached) return cached;
    return this.rebuild(symbolId, name, filePath);
  }

  public async getStoryByName(name: string, filePath?: string): Promise<SymbolStory | undefined> {
    const matches = this.repo.getByName(name);
    if (filePath) {
      const match = matches.find((s) => s.filePath === filePath);
      if (match) return match;
    }
    if (matches.length > 0) return matches[0];
    return this.rebuild(`sym_${name}`, name, filePath ?? 'src/index.ts');
  }

  public async getStoryTimeline(symbolId: string): Promise<StoryMilestone[]> {
    const story = await this.getStory(symbolId);
    return story.milestones;
  }

  public async getBirth(symbolId: string): Promise<StoryBirth | undefined> {
    const story = await this.getStory(symbolId);
    return story.birth;
  }

  public async getContributors(symbolId: string): Promise<StoryContributor[]> {
    const story = await this.getStory(symbolId);
    return story.contributors;
  }

  public async getDecisions(symbolId: string): Promise<StoryDecision[]> {
    const story = await this.getStory(symbolId);
    return story.decisions;
  }

  public async getBugs(symbolId: string): Promise<StoryBug[]> {
    const story = await this.getStory(symbolId);
    return story.bugs;
  }

  public async getRefactors(symbolId: string): Promise<StoryRefactor[]> {
    const story = await this.getStory(symbolId);
    return story.refactors;
  }

  public async getDependencies(symbolId: string): Promise<StoryDependency[]> {
    const story = await this.getStory(symbolId);
    return story.dependencies;
  }

  public async getSessions(symbolId: string): Promise<StorySession[]> {
    const story = await this.getStory(symbolId);
    return story.sessions;
  }

  public async getMetrics(symbolId: string): Promise<StoryMetrics> {
    const story = await this.getStory(symbolId);
    return story.metrics;
  }

  public async getRiskHistory(symbolId: string): Promise<StoryRiskPoint[]> {
    const story = await this.getStory(symbolId);
    return story.riskHistory ?? [];
  }

  public async getEvidence(symbolId: string): Promise<StoryEvidence[]> {
    const story = await this.getStory(symbolId);
    return story.evidence;
  }

  public async handleEvent(event: any): Promise<void> {
    const type = event.type ?? event.eventName ?? '';
    const payload = event.payload ?? {};

    if (type === 'FILE_MODIFIED' && payload.filePath) {
      this.repo.invalidateByFilePath(payload.filePath);
    } else if (type === 'SYMBOL_CHANGED' && payload.symbolId) {
      this.repo.invalidate(payload.symbolId);
    } else if ((type === 'RECORD_DECISION' || type === 'BUG_EVENT' || type === 'REFACTOR_EVENT') && payload.filePath) {
      this.repo.invalidateByFilePath(payload.filePath);
      if (payload.symbolId) this.repo.invalidate(payload.symbolId);
      if (Array.isArray(payload.boundSymbols)) {
        payload.boundSymbols.forEach((s: string) => this.repo.invalidate(s));
      }
    } else if (type === 'ARCHITECTURAL_DRIFT_DETECTED') {
      if (Array.isArray(payload.affectedFiles)) {
        payload.affectedFiles.forEach((f: string) => this.repo.invalidateByFilePath(f));
      }
      if (Array.isArray(payload.affectedSymbols)) {
        payload.affectedSymbols.forEach((s: string) => this.repo.invalidate(s));
      }
    } else if (type === 'CHANGE_IMPACT_ANALYZED') {
      if (payload.rootId) {
        if (payload.rootId.includes('/')) {
          this.repo.invalidateByFilePath(payload.rootId);
        } else {
          this.repo.invalidate(payload.rootId);
        }
      }
      if (Array.isArray(payload.affectedFiles)) {
        payload.affectedFiles.forEach((f: string) => this.repo.invalidateByFilePath(f));
      }
      if (Array.isArray(payload.affectedSymbols)) {
        payload.affectedSymbols.forEach((s: string) => this.repo.invalidate(s));
      }
    } else if (payload.symbolId) {
      this.repo.invalidate(payload.symbolId);
    } else if (payload.filePath) {
      this.repo.invalidateByFilePath(payload.filePath);
    }
  }

  public async rebuild(symbolId: string, name?: string, filePath?: string): Promise<SymbolStory> {
    this.logger?.info(`[SymbolStoryEngine] Rebuilding story for symbol ${symbolId}`);

    const existingStory = this.repo.getBySymbolId(symbolId);

    let rawEvents: any[] = [];
    if (this.deps.eventStore) {
      const res = await this.deps.eventStore.getEvents({});
      if (res.isSuccess) {
        rawEvents = res.value;
      }
    }

    const resolvedName = name ?? symbolId.split('_').pop() ?? symbolId;
    const resolvedPath = filePath ?? 'src/index.ts';

    // Rename and Move Continuity Detection
    const statusInfo = this.renameDetector.detectStatus(rawEvents, resolvedPath, resolvedName);
    const oldPaths = statusInfo.oldPaths;
    const oldNames = statusInfo.oldNames;

    // Extractors with Continuity Support
    const birth = this.birthExtractor.extractBirth(symbolId, resolvedName, resolvedPath, rawEvents, oldPaths);
    const milestones = this.milestoneExtractor.extractMilestones(symbolId, resolvedPath, rawEvents, oldPaths, oldNames);
    const contributors = this.contributorExtractor.extractContributors(rawEvents);
    const decisions = this.decisionExtractor.extractDecisions(symbolId, resolvedPath, this.deps.memoryQueryEngine);
    const bugs = this.bugExtractor.extractBugs(symbolId, resolvedPath, this.deps.memoryQueryEngine);
    const refactors = this.refactorExtractor.extractRefactors(symbolId, resolvedPath, this.deps.memoryQueryEngine);
    const dependencies = this.dependencyExtractor.extractDependencies(symbolId, this.deps.symbolGraph);
    const sessions = this.sessionExtractor.extractSessions(resolvedPath, this.deps.sessionEngine);
    const riskHistory = this.riskExtractor.extractRiskHistory(resolvedPath, this.deps.driftSentinel);

    const metrics: StoryMetrics = {
      totalChanges: milestones.length,
      totalCommits: contributors.reduce((s, c) => s + c.commits, 0),
      totalContributors: contributors.length,
      complexityScore: 0.25,
      riskScore: riskHistory.length > 0 ? riskHistory[0].riskScore : 0.05,
      impactScore: 0.50,
      confidenceScore: 0.95,
      dependencyCount: dependencies.length,
      decisionCount: decisions.length,
      bugCount: bugs.length,
      refactorCount: refactors.length,
      sessionCount: sessions.length,
    };

    const evidence: StoryEvidence[] = [
      {
        id: `ev_story_${symbolId}`,
        source: 'AST',
        description: `Parsed AST symbol info for ${resolvedName} in ${resolvedPath}`,
        certainty: 'OBSERVED',
        confidence: 0.95,
      },
    ];

    if (oldNames.length > 0) {
      evidence.push({
        id: `ev_rename_${symbolId}`,
        source: 'EVENT_STORE',
        description: `Renamed from historical symbol name ${oldNames.join(', ')}`,
        certainty: 'OBSERVED',
        confidence: 0.95,
      });
    }

    if (oldPaths.length > 0) {
      evidence.push({
        id: `ev_move_${symbolId}`,
        source: 'EVENT_STORE',
        description: `Moved from historical file path ${oldPaths.join(', ')}`,
        certainty: 'OBSERVED',
        confidence: 0.95,
      });
    }

    const timestamp = new Date().toISOString();
    const newStory: SymbolStory = {
      symbolId,
      name: resolvedName,
      kind: 'class',
      language: 'typescript',
      filePath: resolvedPath,
      currentLocation: {
        filePath: resolvedPath,
        startLine: 1,
        startColumn: 0,
        endLine: 20,
        endColumn: 0,
      },
      status: statusInfo.status,
      birth,
      milestones,
      contributors,
      decisions,
      bugs,
      refactors,
      dependencies,
      sessions,
      metrics,
      riskHistory,
      confidence: 0.95,
      evidence,
      generatedAt: timestamp,
    };

    this.repo.save(newStory);

    // Event Bus Contract Emissions
    if (this.deps.eventBus) {
      // 1. SYMBOL_STORY_UPDATED
      this.deps.eventBus.publish({
        id: `evt_story_upd_${symbolId}`,
        type: 'SYMBOL_STORY_UPDATED' as any,
        timestamp,
        payload: {
          symbolId,
          timestamp,
          changedSections: ['milestones', 'metrics'],
          confidence: 0.95,
        },
      } as any);

      // 2. SYMBOL_STORY_MILESTONE_ADDED (if milestones increased)
      const prevMilestoneCount = existingStory?.milestones?.length ?? 0;
      if (milestones.length > prevMilestoneCount) {
        const latestMilestone = milestones[milestones.length - 1];
        this.deps.eventBus.publish({
          id: `evt_story_ms_${symbolId}_${latestMilestone.id}`,
          type: 'SYMBOL_STORY_MILESTONE_ADDED' as any,
          timestamp,
          payload: {
            symbolId,
            timestamp,
            milestone: latestMilestone,
            confidence: latestMilestone.confidence,
          },
        } as any);
      }

      // 3. SYMBOL_STORY_RISK_CHANGED (if risk changed)
      const prevRiskScore = existingStory?.metrics?.riskScore ?? -1;
      if (metrics.riskScore !== prevRiskScore) {
        this.deps.eventBus.publish({
          id: `evt_story_risk_${symbolId}`,
          type: 'SYMBOL_STORY_RISK_CHANGED' as any,
          timestamp,
          payload: {
            symbolId,
            timestamp,
            previousRiskScore: prevRiskScore,
            newRiskScore: metrics.riskScore,
            confidence: 0.95,
          },
        } as any);
      }
    }

    return newStory;
  }

  public async rebuildAll(workspace = 'default-workspace'): Promise<SymbolStory[]> {
    this.repo.clear();
    const stories: SymbolStory[] = [];
    if (this.deps.symbolGraph) {
      for (const node of this.deps.symbolGraph.getAllNodes()) {
        const story = await this.rebuild(node.id, node.name, node.location.filePath);
        stories.push(story);
      }
    }
    return stories;
  }

  public clear(): void {
    this.repo.clear();
  }
}
