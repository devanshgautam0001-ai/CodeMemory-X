import { ILogger } from '@codememory/logging';
import { InMemoryEventBus } from '@codememory/event-bus';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { ConfidenceEngine } from '@codememory/confidence-engine';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { ChangeImpactEngine } from '@codememory/change-impact';
import { IntentCaptureEngine } from '@codememory/intent-capture';

import { DeveloperSession } from '../types/DeveloperSession.js';
import { SessionState, ActivityLevel } from '../types/SessionTypes.js';
import { SessionSummary, SessionImpactSummary, SessionRisk } from '../types/SessionSummary.js';
import { SessionIntent } from '../types/SessionIntent.js';

import { SessionReconstructor } from '../reconstruction/SessionReconstructor.js';
import { SessionEventReducer } from '../reconstruction/SessionEventReducer.js';
import { SessionStateClassifier } from '../classification/SessionStateClassifier.js';
import { ActivityClassifier } from '../classification/ActivityClassifier.js';
import { FocusClassifier } from '../classification/FocusClassifier.js';

import { IntentAggregator } from '../aggregation/IntentAggregator.js';
import { DecisionAggregator } from '../aggregation/DecisionAggregator.js';
import { BugAggregator } from '../aggregation/BugAggregator.js';
import { RefactorAggregator } from '../aggregation/RefactorAggregator.js';
import { ImpactAggregator } from '../aggregation/ImpactAggregator.js';
import { RiskAggregator } from '../aggregation/RiskAggregator.js';

import { SessionConfidenceScorer } from '../scoring/SessionConfidenceScorer.js';
import { SessionRepository } from '../repository/SessionRepository.js';

export interface EngineDependencies {
  memoryQueryEngine?: MemoryQueryEngine;
  confidenceEngine?: ConfidenceEngine;
  driftSentinel?: DriftSentinel;
  changeImpactEngine?: ChangeImpactEngine;
  intentCaptureEngine?: IntentCaptureEngine;
  eventBus?: InMemoryEventBus;
}

export class SessionIntelligenceEngine {
  private repo: SessionRepository;
  private reducer: SessionEventReducer;
  private stateClassifier: SessionStateClassifier;
  private activityClassifier: ActivityClassifier;
  private focusClassifier: FocusClassifier;

  private intentAgg: IntentAggregator;
  private decisionAgg: DecisionAggregator;
  private bugAgg: BugAggregator;
  private refactorAgg: RefactorAggregator;
  private impactAgg: ImpactAggregator;
  private riskAgg: RiskAggregator;

  private confidenceScorer: SessionConfidenceScorer;
  private reconstructor: SessionReconstructor;

  constructor(
    private readonly deps: EngineDependencies = {},
    private readonly logger?: ILogger
  ) {
    this.repo = new SessionRepository();
    this.reducer = new SessionEventReducer();
    this.stateClassifier = new SessionStateClassifier();
    this.activityClassifier = new ActivityClassifier();
    this.focusClassifier = new FocusClassifier();

    this.intentAgg = new IntentAggregator();
    this.decisionAgg = new DecisionAggregator();
    this.bugAgg = new BugAggregator();
    this.refactorAgg = new RefactorAggregator();
    this.impactAgg = new ImpactAggregator();
    this.riskAgg = new RiskAggregator();

    this.confidenceScorer = new SessionConfidenceScorer();
    this.reconstructor = new SessionReconstructor();
  }

  public startSession(workspace: string): DeveloperSession {
    const timestamp = new Date().toISOString();
    const sessionId = `session_${workspace}_${Date.now()}`;

    const newSession: DeveloperSession = {
      sessionId,
      workspace,
      startTime: timestamp,
      lastActivityTime: timestamp,
      durationMs: 0,
      activeFiles: [],
      activeSymbols: [],
      recentChanges: [],
      detectedIntents: [],
      relatedDecisions: [],
      relatedBugs: [],
      relatedRefactors: [],
      activityLevel: 'ACTIVE',
      state: 'EXPLORING',
      confidence: 0.90,
      evidence: [
        {
          id: `ev_start_${sessionId}`,
          certainty: 'OBSERVED',
          source: 'session-intelligence',
          description: `Developer session started in workspace ${workspace}`,
          observedAt: timestamp,
          eventIds: [],
        },
      ],
      generatedAt: timestamp,
    };

    this.repo.save(newSession);
    this.repo.setCurrentId(sessionId);

    this.publishEvent('SESSION_STARTED', newSession);
    return newSession;
  }

  public recordEvent(event: any): DeveloperSession {
    let current = this.repo.getCurrent();
    if (!current) {
      current = this.startSession(event.workspace ?? 'default-workspace');
    }

    return this.updateSession(event);
  }

  public updateSession(event: any): DeveloperSession {
    const current = this.repo.getCurrent();
    if (!current) return this.startSession('default-workspace');

    const previousState = current.state;
    let updated = this.reducer.reduce(current, event);

    // Intent Extraction
    if (this.deps.intentCaptureEngine && event.payload?.comment) {
      const intentObj = this.deps.intentCaptureEngine.extractFromCommit(
        event.payload.comment,
        event.payload.filePath ? [event.payload.filePath] : []
      );
      if (intentObj) {
        updated.detectedIntents.push({
          intentId: intentObj.id,
          type: intentObj.type,
          description: intentObj.reason,
          confidence: intentObj.confidence,
          evidenceEventIds: [event.id ?? 'evt'],
          observedAt: intentObj.timestamp,
        });
      }
    }

    // Classifications
    const activeFilePaths = updated.activeFiles.map((f) => f.filePath);

    updated.activityLevel = this.activityClassifier.classify(
      updated.lastActivityTime,
      updated.recentChanges.length
    );

    const stateResult = this.stateClassifier.classifyState(updated);
    updated.state = stateResult.state;
    updated.evidence.push(...stateResult.evidence);

    // Aggregations
    updated.relatedDecisions = this.decisionAgg.aggregate(activeFilePaths, this.deps.memoryQueryEngine);
    updated.relatedBugs = this.bugAgg.aggregate(activeFilePaths, this.deps.memoryQueryEngine);
    updated.relatedRefactors = this.refactorAgg.aggregate(activeFilePaths, this.deps.memoryQueryEngine);
    updated.impactSummary = this.impactAgg.aggregate(activeFilePaths, this.deps.changeImpactEngine);
    updated.architecturalRisks = this.riskAgg.aggregate(activeFilePaths, this.deps.driftSentinel);

    // Focus
    const focus = this.focusClassifier.classifyFocus(updated.activeFiles, updated.activeSymbols);
    for (const sym of updated.activeSymbols) {
      sym.isPrimaryFocus = focus.topSymbols.includes(sym.name);
    }

    updated.confidence = this.confidenceScorer.calculateConfidence(updated);
    updated.generatedAt = new Date().toISOString();

    this.repo.save(updated);

    if (previousState !== updated.state) {
      this.publishEvent('SESSION_STATE_CHANGED', updated);
    } else {
      this.publishEvent('SESSION_UPDATED', updated);
    }

    return updated;
  }

  public pauseSession(): DeveloperSession | undefined {
    const current = this.repo.getCurrent();
    if (!current) return undefined;
    current.activityLevel = 'IDLE';
    this.repo.save(current);
    this.publishEvent('SESSION_UPDATED', current);
    return current;
  }

  public resumeSession(): DeveloperSession | undefined {
    const current = this.repo.getCurrent();
    if (!current) return undefined;
    current.activityLevel = 'ACTIVE';
    current.lastActivityTime = new Date().toISOString();
    this.repo.save(current);
    this.publishEvent('SESSION_UPDATED', current);
    return current;
  }

  public endSession(): DeveloperSession | undefined {
    const current = this.repo.getCurrent();
    if (!current) return undefined;
    current.activityLevel = 'IDLE';
    this.repo.save(current);
    this.publishEvent('SESSION_ENDED', current);
    this.repo.setCurrentId(undefined);
    return current;
  }

  public getCurrentSession(): DeveloperSession | undefined {
    return this.repo.getCurrent();
  }

  public getSession(sessionId: string): DeveloperSession | undefined {
    return this.repo.getById(sessionId);
  }

  public getRecentSessions(limit = 5): DeveloperSession[] {
    return this.repo.getAll().slice(0, limit);
  }

  public getSessionSummary(sessionId?: string): SessionSummary | undefined {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return undefined;
    const session = this.repo.getById(targetId);
    if (!session) return undefined;

    const focus = this.focusClassifier.classifyFocus(session.activeFiles, session.activeSymbols);
    const intentAgg = this.intentAgg.aggregate(session.detectedIntents);

    return {
      primaryFocus: [...focus.topFiles, ...focus.topSymbols],
      dominantState: session.state,
      dominantIntent: intentAgg.dominantIntent,
      filesChanged: session.activeFiles.length,
      symbolsTouched: session.activeSymbols.length,
      decisionsRelated: session.relatedDecisions.length,
      bugsRelated: session.relatedBugs.length,
      refactorsRelated: session.relatedRefactors.length,
      highImpactChanges: session.impactSummary?.highImpactEntities ?? 0,
      architecturalRisks: session.architecturalRisks?.length ?? 0,
      activityLevel: session.activityLevel,
      confidence: session.confidence,
    };
  }

  public getSessionState(sessionId?: string): SessionState | undefined {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return undefined;
    return this.repo.getById(targetId)?.state;
  }

  public getPrimaryFocus(sessionId?: string): { topFiles: string[]; topSymbols: string[] } {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return { topFiles: [], topSymbols: [] };
    const session = this.repo.getById(targetId);
    if (!session) return { topFiles: [], topSymbols: [] };
    return this.focusClassifier.classifyFocus(session.activeFiles, session.activeSymbols);
  }

  public getSessionIntents(sessionId?: string): SessionIntent[] {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return [];
    return this.repo.getById(targetId)?.detectedIntents ?? [];
  }

  public getSessionDecisions(sessionId?: string) {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return [];
    return this.repo.getById(targetId)?.relatedDecisions ?? [];
  }

  public getSessionBugs(sessionId?: string) {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return [];
    return this.repo.getById(targetId)?.relatedBugs ?? [];
  }

  public getSessionRefactors(sessionId?: string) {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return [];
    return this.repo.getById(targetId)?.relatedRefactors ?? [];
  }

  public getSessionImpact(sessionId?: string): SessionImpactSummary | undefined {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return undefined;
    return this.repo.getById(targetId)?.impactSummary;
  }

  public getSessionRisks(sessionId?: string): SessionRisk[] {
    const targetId = sessionId ?? this.repo.getCurrent()?.sessionId;
    if (!targetId) return [];
    return this.repo.getById(targetId)?.architecturalRisks ?? [];
  }

  public rebuildFromEvents(workspace = 'default-workspace', events: any[] = []): DeveloperSession[] {
    const rebuiltSessions = this.reconstructor.reconstructFromEvents(workspace, events);
    for (const session of rebuiltSessions) {
      this.repo.save(session);
    }
    if (rebuiltSessions.length > 0) {
      this.repo.setCurrentId(rebuiltSessions[rebuiltSessions.length - 1].sessionId);
    }
    return rebuiltSessions;
  }

  public clear(): void {
    this.repo.clear();
  }

  private publishEvent(type: string, session: DeveloperSession): void {
    if (this.deps.eventBus) {
      this.deps.eventBus.publish({
        id: `evt_${type.toLowerCase()}_${Date.now()}`,
        type: type as any,
        timestamp: new Date().toISOString(),
        payload: {
          sessionId: session.sessionId,
          workspace: session.workspace,
          state: session.state,
          activityLevel: session.activityLevel,
          confidence: session.confidence,
          timestamp: session.generatedAt,
        },
      } as any);
    }
  }
}
