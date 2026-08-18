import { AssistantRequest } from '../types/AssistantRequest.js';
import { AssistantContext } from '../types/AssistantContext.js';
import { AssistantMessage } from '../types/AssistantTypes.js';
import { MemoryContextProvider } from './MemoryContextProvider.js';
import { SymbolContextProvider } from './SymbolContextProvider.js';
import { SessionContextProvider } from './SessionContextProvider.js';
import { DecisionContextProvider } from './DecisionContextProvider.js';
import { RiskContextProvider } from './RiskContextProvider.js';
import { ImpactContextProvider } from './ImpactContextProvider.js';
import { ContextRanker, ContextPriority } from './ContextRanker.js';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { SymbolStoryEngine } from '@codememory/story-engine';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { ChangeImpactEngine } from '@codememory/change-impact';

export interface ContextCollectorDependencies {
  queryEngine?: MemoryQueryEngine;
  storyEngine?: SymbolStoryEngine;
  sessionEngine?: SessionIntelligenceEngine;
  driftSentinel?: DriftSentinel;
  impactEngine?: ChangeImpactEngine;
}

export class ContextCollector {
  private memoryProvider: MemoryContextProvider;
  private symbolProvider: SymbolContextProvider;
  private sessionProvider: SessionContextProvider;
  private decisionProvider: DecisionContextProvider;
  private riskProvider: RiskContextProvider;
  private impactProvider: ImpactContextProvider;

  constructor(deps: ContextCollectorDependencies) {
    this.memoryProvider = new MemoryContextProvider(deps.queryEngine);
    this.symbolProvider = new SymbolContextProvider(deps.storyEngine);
    this.sessionProvider = new SessionContextProvider(deps.sessionEngine);
    this.decisionProvider = new DecisionContextProvider(deps.queryEngine);
    this.riskProvider = new RiskContextProvider(deps.driftSentinel);
    this.impactProvider = new ImpactContextProvider(deps.impactEngine);
  }

  public async collectContext(
    request: AssistantRequest,
    conversationHistory?: AssistantMessage[]
  ): Promise<AssistantContext> {
    const [rawMemories, symbolStory, sessionSummary, rawDecisions, rawDriftFindings, changeImpact] =
      await Promise.all([
        this.memoryProvider.getMemories(request),
        this.symbolProvider.getSymbolStory(request),
        this.sessionProvider.getSessionSummary(request),
        this.decisionProvider.getDecisions(request),
        this.riskProvider.getRiskFindings(request),
        this.impactProvider.getChangeImpact(request),
      ]);

    const rankedMem = ContextRanker.rankItems(rawMemories, request, conversationHistory);
    const rankedDec = ContextRanker.rankItems(rawDecisions, request, conversationHistory);
    const rankedDrift = ContextRanker.rankItems(rawDriftFindings, request, conversationHistory);

    const combinedScores: Record<string, { score: number; priority: ContextPriority; signals: string[] }> = {
      ...rankedMem.itemScores,
      ...rankedDec.itemScores,
      ...rankedDrift.itemScores,
    };

    const memories = rankedMem.rankedItems;
    const decisions = rankedDec.rankedItems;
    const driftFindings = rankedDrift.rankedItems;

    const contextJson = JSON.stringify({
      memories,
      symbolStory,
      sessionSummary,
      decisions,
      driftFindings,
      changeImpact,
    });

    const estTokens = Math.ceil(contextJson.length / 4);

    return {
      memories,
      symbolStory,
      sessionSummary,
      decisions,
      driftFindings,
      changeImpact,
      totalTokens: estTokens,
      evidenceScores: combinedScores,
    };
  }
}
