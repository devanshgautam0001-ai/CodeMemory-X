import { IAIProvider, StreamingChunk, ToolDefinition, AIProviderFactory } from '@codememory/ai-provider';
import { Result, ok, fail, SystemHealthSnapshot } from '@codememory/shared';
import { ILogger } from '@codememory/logging';
import { EventStore } from '@codememory/event-store';
import { ToolExecutor, ToolRegistry, ToolCallOrchestrator, ToolExecutionAudit, ToolExecutionQuery, ToolExecutionQueryResult, ToolExecutionAnalytics, ToolExecutionExportRow, ToolExecutionReportJson, AnalyticsChartData } from '@codememory/tool-runtime';
import { SystemHealthAggregator } from '../health/SystemHealthAggregator.js';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { SymbolStoryEngine } from '@codememory/story-engine';
import { SessionIntelligenceEngine } from '@codememory/session-intelligence';
import { DriftSentinel } from '@codememory/drift-sentinel';
import { ChangeImpactEngine } from '@codememory/change-impact';

import { AssistantRequest, AssistantRequestOptions } from '../types/AssistantRequest.js';
import { AssistantResponse } from '../types/AssistantResponse.js';
import { AssistantContext } from '../types/AssistantContext.js';
import { AssistantMessage } from '../types/AssistantTypes.js';
import { AssistantConfig } from '../types/AssistantConfig.js';
import { ContextCollector } from '../context/ContextCollector.js';
import { PromptBudgetManager } from '../prompting/PromptBudgetManager.js';
import { ContextCompressor } from '../prompting/ContextCompressor.js';
import { SystemPromptBuilder } from '../prompting/SystemPromptBuilder.js';
import { AssistantConversationRepository } from '../repository/AssistantConversationRepository.js';
import { AssistantSecurityPolicy } from '../security/AssistantSecurityPolicy.js';

export interface AIAssistantEngineDependencies {
  provider: IAIProvider;
  eventStore?: EventStore;
  toolRegistry?: ToolRegistry;
  toolExecutor?: ToolExecutor;
  memoryQueryEngine?: MemoryQueryEngine;
  storyEngine?: SymbolStoryEngine;
  sessionEngine?: SessionIntelligenceEngine;
  driftSentinel?: DriftSentinel;
  impactEngine?: ChangeImpactEngine;
}

import { ToolApprovalManager, ToolApprovalRequest } from '@codememory/tool-runtime';
import { ToolApprovalRepository } from '@codememory/tool-runtime';
import { ToolExecutionAuditor } from '@codememory/tool-runtime';

export class AIAssistantEngine {
  private contextCollector: ContextCollector;
  private budgetManager: PromptBudgetManager;
  private compressor: ContextCompressor;
  private promptBuilder: SystemPromptBuilder;
  private repo: AssistantConversationRepository;
  private approvalManager: ToolApprovalManager;
  private approvalRepo?: ToolApprovalRepository;
  private auditor: ToolExecutionAuditor;
  private activeControllers = new Map<string, AbortController>();

  constructor(
    private readonly deps: AIAssistantEngineDependencies,
    private readonly config: AssistantConfig = {},
    private readonly logger?: ILogger
  ) {
    this.approvalManager = new ToolApprovalManager(logger);
    this.contextCollector = new ContextCollector({
      queryEngine: deps.memoryQueryEngine,
      storyEngine: deps.storyEngine,
      sessionEngine: deps.sessionEngine,
      driftSentinel: deps.driftSentinel,
      impactEngine: deps.impactEngine,
    });
    this.budgetManager = new PromptBudgetManager(config.defaultMaxContextTokens ?? 4096);
    this.compressor = new ContextCompressor(this.budgetManager);
    this.promptBuilder = new SystemPromptBuilder(config.systemPromptPrefix);
    this.repo = new AssistantConversationRepository(deps.eventStore, config.defaultMaxContextTokens ? 'workspace' : 'global', logger);
    if (deps.eventStore) {
      this.approvalRepo = new ToolApprovalRepository(
        deps.eventStore,
        config.defaultMaxContextTokens ? 'workspace' : 'global',
        logger
      );
    }
    const workspace = config.defaultMaxContextTokens ? 'workspace' : 'global';
    this.auditor = new ToolExecutionAuditor(
      undefined, // eventBus wired externally if needed
      logger,
      deps.eventStore as any,
      workspace
    );
  }

  public async getContext(request: AssistantRequest): Promise<AssistantContext> {
    const history = request.conversationId ? this.repo.get(request.conversationId) : undefined;
    const rawContext = await this.contextCollector.collectContext(request, history);
    const budget = this.budgetManager.getBudget(request.options?.maxContextTokens);
    return this.compressor.compress(rawContext, budget);
  }

  private resolveProvider(options?: AssistantRequestOptions): IAIProvider {
    if (options?.provider) {
      try {
        const factory = new AIProviderFactory(this.logger);
        const res = factory.getProvider(options.provider, {
          defaultModel: options.model,
        });
        if (res.isSuccess) {
          return res.value;
        }
      } catch (err: any) {
        this.logger?.warn(`[AIAssistantEngine] Failed to resolve provider '${options.provider}', using default`, err);
      }
    }
    return this.deps.provider;
  }

  public async ask(request: AssistantRequest): Promise<Result<AssistantResponse>> {
    AssistantSecurityPolicy.validatePrompt(request.prompt);
    const startTime = Date.now();
    const conversationId = request.conversationId ?? `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const controller = new AbortController();
    this.activeControllers.set(request.requestId, controller);

    try {
      const activeProvider = this.resolveProvider(request.options);
      const contextUsed = await this.getContext(request);
      const systemPrompt = this.promptBuilder.buildSystemPrompt(contextUsed);

      const userMsg: AssistantMessage = {
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: request.prompt,
        timestamp: new Date().toISOString(),
      };
      this.repo.addMessage(conversationId, userMsg);

      const history = this.repo.get(conversationId);
      const formattedMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((m) => ({ role: m.role as any, content: m.content })),
      ];

      const enableTools = request.options?.enableTools ?? this.config.defaultEnableTools ?? true;
      let tools: ToolDefinition[] | undefined;
      if (enableTools && this.deps.toolRegistry) {
        tools = this.deps.toolRegistry.getDefinitions();
      }

      let content = '';
      let finishReason = 'stop';
      let toolCallsExecuted: any[] | undefined;

      if (enableTools && this.deps.toolExecutor && tools && tools.length > 0) {
        const orchestrator = new ToolCallOrchestrator(
          activeProvider,
          this.deps.toolExecutor,
          {},
          this.logger
        );

        const orchRes = await orchestrator.orchestrate(
          {
            messages: formattedMessages,
            tools,
            temperature: request.options?.temperature,
            maxTokens: request.options?.maxTokens,
          },
          {
            signal: controller.signal,
            conversationId,
            approvalManager: this.approvalManager,
            approvalRepo: this.approvalRepo,
            auditor: this.auditor,
            onApprovalRequest: undefined,
          }
        );

        if (orchRes.isFailure) {
          return fail(orchRes.error);
        }

        content = orchRes.value.content || '';
        finishReason = orchRes.value.finishReason ?? 'stop';
      } else {
        const genRes = await activeProvider.generate({
          messages: formattedMessages,
          temperature: request.options?.temperature,
          maxTokens: request.options?.maxTokens,
          signal: controller.signal,
        });

        if (genRes.isFailure) {
          return fail(genRes.error);
        }

        content = genRes.value.content || '';
        finishReason = genRes.value.finishReason ?? 'stop';
      }

      const sanitizedContent = AssistantSecurityPolicy.sanitize(content);

      const assistantMsg: AssistantMessage = {
        id: `msg_ast_${Date.now()}`,
        role: 'assistant',
        content: sanitizedContent,
        timestamp: new Date().toISOString(),
      };
      this.repo.addMessage(conversationId, assistantMsg);

      const durationMs = Date.now() - startTime;
      const response: AssistantResponse = {
        requestId: request.requestId,
        conversationId,
        content: sanitizedContent,
        contextUsed,
        toolCallsExecuted,
        durationMs,
        finishReason,
      };

      return ok(response);
    } catch (err: any) {
      return fail(err);
    } finally {
      this.activeControllers.delete(request.requestId);
    }
  }

  public async *stream(request: AssistantRequest): AsyncGenerator<StreamingChunk> {
    AssistantSecurityPolicy.validatePrompt(request.prompt);
    const conversationId = request.conversationId ?? `conv_${Date.now()}`;
    const controller = new AbortController();
    this.activeControllers.set(request.requestId, controller);

    try {
      const activeProvider = this.resolveProvider(request.options);
      const contextUsed = await this.getContext(request);
      const systemPrompt = this.promptBuilder.buildSystemPrompt(contextUsed);

      const userMsg: AssistantMessage = {
        id: `msg_user_${Date.now()}`,
        role: 'user',
        content: request.prompt,
        timestamp: new Date().toISOString(),
      };
      this.repo.addMessage(conversationId, userMsg);

      const history = this.repo.get(conversationId);
      const formattedMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((m) => ({ role: m.role as any, content: m.content })),
      ];

      const streamGen = activeProvider.generateStream({
        messages: formattedMessages,
        temperature: request.options?.temperature,
        maxTokens: request.options?.maxTokens,
        signal: controller.signal,
      });

      let fullText = '';
      for await (const chunk of streamGen) {
        if (controller.signal.aborted) {
          break;
        }
        if (chunk.contentDelta) {
          fullText += chunk.contentDelta;
        }
        yield chunk;
      }

      if (fullText) {
        this.repo.addMessage(conversationId, {
          id: `msg_ast_${Date.now()}`,
          role: 'assistant',
          content: AssistantSecurityPolicy.sanitize(fullText),
          timestamp: new Date().toISOString(),
        });
      }
    } finally {
      this.activeControllers.delete(request.requestId);
    }
  }

  public cancel(requestId?: string, conversationId?: string): void {
    if (requestId && this.activeControllers.has(requestId)) {
      const controller = this.activeControllers.get(requestId);
      controller?.abort();
      this.activeControllers.delete(requestId);
      this.logger?.info(`[AIAssistantEngine] Cancelled request '${requestId}'`);
    }
    if (conversationId) {
      this.approvalManager.cancelConversationApprovals(conversationId);
    }
    if (!requestId && !conversationId) {
      this.cancelAll();
    }
  }

  public cancelAll(): void {
    for (const [reqId, controller] of this.activeControllers.entries()) {
      try {
        controller.abort();
      } catch (err) {
        this.logger?.warn(`[AIAssistantEngine] Error aborting controller for '${reqId}'`);
      }
    }
    this.activeControllers.clear();
    this.approvalManager.cancelAllPending();
    this.logger?.info('[AIAssistantEngine] Cancelled all active streaming requests & pending approvals');
  }

  public dispose(): void {
    this.cancelAll();
    this.approvalManager.dispose();
  }

  public getConversation(conversationId: string): AssistantMessage[] {
    return this.repo.get(conversationId);
  }

  public createConversation(title?: string): any {
    return this.repo.createConversation(undefined, title);
  }

  public listConversations(): any[] {
    return this.repo.listConversations();
  }

  public deleteConversation(conversationId: string): void {
    this.approvalManager.cancelConversationApprovals(conversationId);
    this.repo.deleteConversation(conversationId);
  }

  public clearConversation(conversationId: string): void {
    this.approvalManager.cancelConversationApprovals(conversationId);
    this.repo.clear(conversationId);
  }

  public async rehydrateFromEventStore(eventStore?: EventStore): Promise<number> {
    const targetStore = eventStore ?? this.deps.eventStore;
    if (!targetStore) return 0;

    let processed = 0;
    try {
      const res = await targetStore.getEvents();
      if (res.isSuccess && res.value) {
        const assistantEvts = res.value.filter((e) => e.eventType.startsWith('ASSISTANT_'));
        processed = await this.repo.rebuildFromEvents(assistantEvts);
      }
    } catch (err) {
      this.logger?.warn(`[AIAssistantEngine] Failed to rehydrate conversation events from EventStore:`, { error: (err as Error).message });
    }

    // Recover pending tool approvals that were created before the last VS Code restart
    if (this.approvalRepo) {
      try {
        const pendingApprovals = await this.approvalRepo.getPendingApprovals();
        for (const pending of pendingApprovals) {
          // Re-create the approval in the in-memory manager without a new EventStore event
          // (it was already persisted; we're just restoring state)
          const req = this.approvalManager.createRequest(
            pending.requestId,
            pending.toolCallId,
            pending.toolName,
            pending.arguments,
            new Date(pending.expiresAt).getTime() - Date.now(),
            pending.conversationId
          );
          this.logger?.info(`[AIAssistantEngine] Recovered pending approval ${req.approvalId} for tool '${pending.toolName}'`);
        }
        if (pendingApprovals.length > 0) {
          this.logger?.info(`[AIAssistantEngine] Recovered ${pendingApprovals.length} pending tool approval(s) from EventStore`);
        }
      } catch (err) {
        this.logger?.warn(`[AIAssistantEngine] Failed to recover pending tool approvals:`, { error: (err as Error).message });
      }
    }

    return processed;
  }

  public getApprovalManager(): ToolApprovalManager {
    return this.approvalManager;
  }

  public getPendingApprovals(): ToolApprovalRequest[] {
    return this.approvalManager.getPendingApprovals();
  }

  public respondToolApproval(approvalId: string, response: 'APPROVED' | 'DENIED'): ToolApprovalRequest | undefined {
    const req = this.approvalManager.respondApproval(approvalId, response);
    if (req && this.approvalRepo) {
      this.approvalRepo.persistResponded(req).catch((err: any) => {
        this.logger?.warn('[AIAssistantEngine] Failed to persist approval response:', { error: (err as Error).message });
      });
    }
    return req;
  }

  public getAuditTimeline(conversationId: string, limit = 50): ToolExecutionAudit[] {
    return this.auditor.getTimeline(conversationId, limit);
  }

  public getAuditEntry(executionId: string): ToolExecutionAudit | undefined {
    return this.auditor.getEntry(executionId);
  }

  public async queryToolExecutions(query: ToolExecutionQuery): Promise<ToolExecutionQueryResult> {
    return await this.auditor.queryExecutions(query);
  }

  public async getToolAnalytics(query?: ToolExecutionQuery): Promise<ToolExecutionAnalytics> {
    return await this.auditor.getAnalytics(query);
  }

  public async getToolVisualization(query?: ToolExecutionQuery, numBuckets?: number): Promise<AnalyticsChartData> {
    return await this.auditor.getVisualization(query, numBuckets);
  }

  /**
   * Returns a full (unpaginated) set of tool execution records as a flat JSON array.
   * All records are secrets-free — raw tool arguments are never included.
   * TASK-051: safe for local export; no cloud upload.
   */
  public async exportToolExecutionsJson(query?: ToolExecutionQuery): Promise<ToolExecutionExportRow[]> {
    return await this.auditor.exportExecutions(query);
  }

  /**
   * Returns a full (unpaginated) set of tool execution records as an RFC-4180 CSV string.
   * All records are secrets-free — raw tool arguments are never included.
   * TASK-051: safe for local export; no cloud upload.
   */
  public async exportToolExecutionsCsv(query?: ToolExecutionQuery): Promise<string> {
    return await this.auditor.exportToCsv(query);
  }

  /**
   * TASK-056: Returns a structured JSON report containing schema version metadata,
   * active filter summary, deterministic analytics summary, and records array.
   */
  public async exportToolExecutionsReport(query?: ToolExecutionQuery): Promise<ToolExecutionReportJson> {
    return await this.auditor.exportReportJson(query);
  }

  /**
   * TASK-058: Evaluates and returns deterministic SystemHealthSnapshot.
   */
  public async getSystemHealth(rpcMetricsProvider?: () => any): Promise<SystemHealthSnapshot> {
    const aggregator = new SystemHealthAggregator({
      eventStore: this.deps.eventStore,
      toolRegistry: this.deps.toolRegistry,
      toolExecutor: this.deps.toolExecutor,
      toolAuditor: this.auditor,
      memoryQueryEngine: this.deps.memoryQueryEngine,
      storyEngine: this.deps.storyEngine,
      sessionEngine: this.deps.sessionEngine,
      driftSentinel: this.deps.driftSentinel,
      impactEngine: this.deps.impactEngine,
      provider: this.deps.provider,
      assistantEngine: this,
      rpcMetricsProvider,
    });
    return await aggregator.getSnapshot();
  }
}


