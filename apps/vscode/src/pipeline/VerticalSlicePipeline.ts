import * as fs from 'fs';
import * as path from 'path';
import { ILogger } from '@codememory/logging';
import { InMemoryEventBus } from '@codememory/event-bus';
import { EventStore } from '@codememory/event-store';
import { MemoryEngine } from '@codememory/memory-engine';
import { MemoryQueryEngine } from '@codememory/memory-query';
import { ContextEngine } from '@codememory/context-engine';
import { TreeSitterParser } from '@codememory/tree-sitter-engine';
import { SymbolGraphBuilder, SymbolGraph } from '@codememory/symbol-graph';
import { SimpleGitAdapter, GitService } from '@codememory/git-engine';
import { VSCodeWorkspaceWatcher } from '@codememory/workspace-watcher';
import { ParseResult } from '@codememory/parser-sdk';
import { IntentCaptureEngine } from '@codememory/intent-capture';
import { DecisionCaptureEngine } from '@codememory/decision-capture';
import { RelationshipEngine } from '@codememory/relationship-engine';
import { ConfidenceEngine } from '@codememory/confidence-engine';
import { DriftSentinel, DriftFinding } from '@codememory/drift-sentinel';
import { ChangeImpactEngine, ImpactMap } from '@codememory/change-impact';
import { SessionIntelligenceEngine, DeveloperSession } from '@codememory/session-intelligence';
import { SymbolStoryEngine } from '@codememory/story-engine';
import {
  ToolRegistry,
  ToolPermissionManager,
  ToolExecutionAuditor,
  ToolExecutor,
  registerBuiltInCodeMemoryTools,
} from '@codememory/tool-runtime';
import { AIAssistantEngine } from '@codememory/ai-assistant';
import { AIProviderFactory } from '@codememory/ai-provider';

export interface LivePipelineSnapshot {
  memories: any[];
  timelineData: any;
  symbolStory: any;
  knowledgeGraph: any;
  driftFindings: DriftFinding[];
  changeImpact?: ImpactMap;
  sessionIntelligence?: DeveloperSession;
}

export class VerticalSlicePipeline {
  private eventBus!: InMemoryEventBus;
  private eventStore!: EventStore;
  private memoryEngine!: MemoryEngine;
  private memoryQueryEngine!: MemoryQueryEngine;
  private contextEngine!: ContextEngine;
  private treeSitterParser!: TreeSitterParser;
  private symbolGraphBuilder!: SymbolGraphBuilder;
  private gitService!: GitService;
  private intentCaptureEngine!: IntentCaptureEngine;
  private decisionCaptureEngine!: DecisionCaptureEngine;
  private relationshipEngine!: RelationshipEngine;
  private confidenceEngine!: ConfidenceEngine;
  private driftSentinel!: DriftSentinel;
  private changeImpactEngine!: ChangeImpactEngine;
  private sessionEngine!: SessionIntelligenceEngine;
  private storyEngine!: SymbolStoryEngine;
  private toolRegistry!: ToolRegistry;
  private toolPermissionManager!: ToolPermissionManager;
  private toolAuditor!: ToolExecutionAuditor;
  private toolExecutor!: ToolExecutor;
  private assistantEngine!: AIAssistantEngine;
  private workspaceWatcher?: VSCodeWorkspaceWatcher;
  private isInitialized = false;
  private isDisposed = false;
  private workspacePath: string = '';
  private processingPromise: Promise<any> = Promise.resolve();

  constructor(private readonly logger?: ILogger) {}

  public async initialize(workspacePath: string): Promise<void> {
    if (this.isInitialized) return;
    this.workspacePath = workspacePath;

    this.logger?.info('Initializing Vertical Slice Pipeline for workspace:', { workspacePath });

    try {
      // 1. Setup Event Bus
      this.eventBus = new InMemoryEventBus(undefined, this.logger);

      // 2. Setup WASM SQLite Persistent Event Store
      const dbPath = path.join(workspacePath, '.codememory', 'events.db');
      this.eventStore = new EventStore({ dbPath }, this.logger);
      const esInitRes = await this.eventStore.initialize();
      if (esInitRes.isFailure) {
        this.logger?.error('EventStore failed to initialize:', esInitRes.error);
        throw new Error(`EventStore initialization failed: ${esInitRes.error.message}`);
      }

      // 3. Setup Memory Engine & Rehydrate persisted state
      this.memoryEngine = new MemoryEngine(this.eventStore, this.eventBus, this.logger);
      await this.memoryEngine.rebuild();

      // 4. Setup Query & Context Engines
      this.memoryQueryEngine = new MemoryQueryEngine((this.memoryEngine as any).repository, this.logger);
      this.contextEngine = new ContextEngine(this.memoryQueryEngine, this.logger);

      // 5. Setup Tree-sitter & Symbol Graph
      this.treeSitterParser = new TreeSitterParser('typescript', undefined, this.logger);
      this.symbolGraphBuilder = new SymbolGraphBuilder(this.logger);

      // 6. Setup Intent, Decision, Relationship, Confidence, Drift, Change Impact, Session, & Story Engines
      this.intentCaptureEngine = new IntentCaptureEngine(this.logger);
      this.decisionCaptureEngine = new DecisionCaptureEngine(this.logger);
      this.relationshipEngine = new RelationshipEngine(this.logger);
      this.confidenceEngine = new ConfidenceEngine(this.logger);
      this.driftSentinel = new DriftSentinel(this.eventBus, this.logger);
      this.changeImpactEngine = new ChangeImpactEngine(
        {
          memoryQueryEngine: this.memoryQueryEngine,
          confidenceEngine: this.confidenceEngine,
          driftSentinel: this.driftSentinel,
          eventBus: this.eventBus,
        },
        this.logger
      );
      this.sessionEngine = new SessionIntelligenceEngine(
        {
          memoryQueryEngine: this.memoryQueryEngine,
          confidenceEngine: this.confidenceEngine,
          driftSentinel: this.driftSentinel,
          changeImpactEngine: this.changeImpactEngine,
          intentCaptureEngine: this.intentCaptureEngine,
          eventBus: this.eventBus,
        },
        this.logger
      );
      this.sessionEngine.startSession(workspacePath);
      this.storyEngine = new SymbolStoryEngine(
        {
          eventStore: this.eventStore,
          memoryQueryEngine: this.memoryQueryEngine,
          driftSentinel: this.driftSentinel,
          changeImpactEngine: this.changeImpactEngine,
          sessionEngine: this.sessionEngine,
          eventBus: this.eventBus,
        },
        this.logger
      );

      // 7. Setup Tool Runtime & Register Built-In CodeMemory Tools
      this.toolRegistry = new ToolRegistry(this.logger);
      this.toolPermissionManager = new ToolPermissionManager({ defaultPermission: 'ALLOW' }, this.logger);
      this.toolAuditor = new ToolExecutionAuditor(this.eventBus, this.logger);
      this.toolExecutor = new ToolExecutor(
        this.toolRegistry,
        this.toolPermissionManager,
        this.toolAuditor,
        { defaultTimeoutMs: 30000 },
        this.logger
      );

      registerBuiltInCodeMemoryTools(this.toolRegistry, {
        memoryQueryEngine: this.memoryQueryEngine,
        storyEngine: this.storyEngine,
        impactEngine: this.changeImpactEngine,
        driftEngine: this.driftSentinel,
        sessionEngine: this.sessionEngine,
        relationshipEngine: this.relationshipEngine,
      });

      // 8. Setup AI Assistant Engine
      const providerFactory = new AIProviderFactory(this.logger);
      const providerRes = providerFactory.getProvider('ollama', { defaultModel: 'llama3' });
      const defaultProvider = providerRes.isSuccess ? providerRes.value : (providerFactory.getRegistry().get('ollama')!);

      this.assistantEngine = new AIAssistantEngine(
        {
          provider: defaultProvider,
          eventStore: this.eventStore,
          toolRegistry: this.toolRegistry,
          toolExecutor: this.toolExecutor,
          memoryQueryEngine: this.memoryQueryEngine,
          storyEngine: this.storyEngine,
          sessionEngine: this.sessionEngine,
          driftSentinel: this.driftSentinel,
          impactEngine: this.changeImpactEngine,
        },
        { workspacePath: this.workspacePath },
        this.logger
      );

      // Rehydrate persistent AI Assistant conversations from EventStore on startup
      await this.assistantEngine.rehydrateFromEventStore(this.eventStore);

      // 9. Setup Git Service Engine
      const gitAdapter = new SimpleGitAdapter(this.logger);
      this.gitService = new GitService(gitAdapter, this.logger);

      // 10. Setup VSCode Workspace Watcher for TypeScript files
      this.workspaceWatcher = new VSCodeWorkspaceWatcher(this.logger);
      await this.workspaceWatcher.startWatching();

      this.isInitialized = true;

      // Record Session Started Event
      await this.eventStore.appendEvent({
        id: `evt_sess_${Date.now()}`,
        eventType: 'SESSION_STARTED',
        timestamp: new Date().toISOString(),
        correlationId: `corr_sess_01`,
        source: 'extension-host',
        workspace: workspacePath,
        payload: { title: 'TypeScript Vertical Slice Development Session' },
        metadata: { environment: 'vscode' },
        version: 1,
        createdAt: new Date().toISOString(),
      });

      // Initial Scan of Workspace TypeScript files
      await this.processInitialScan();
    } catch (err) {
      this.isInitialized = false;
      this.logger?.error('VerticalSlicePipeline initialization encountered error:', err as Error);
      await this.dispose();
      throw err;
    }
  }

  private async processInitialScan(): Promise<void> {
    try {
      const files = this.scanTsFiles(this.workspacePath, 15);
      for (const filePath of files) {
        await this.processTypeScriptFile(filePath);
      }
    } catch (err) {
      this.logger?.error('Error during initial TypeScript scan:', err as Error);
    }
  }

  private scanTsFiles(dir: string, limit: number, fileList: string[] = []): string[] {
    if (fileList.length >= limit || !fs.existsSync(dir)) return fileList;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (fileList.length >= limit) break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        this.scanTsFiles(fullPath, limit, fileList);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  public async processTypeScriptFile(filePath: string, customContent?: string): Promise<LivePipelineSnapshot> {
    // Queue execution sequentially to prevent WASM SQLite concurrent write races
    this.processingPromise = this.processingPromise
      .catch(() => {})
      .then(() => this.executeProcessFile(filePath, customContent));
    return this.processingPromise;
  }

  private async executeProcessFile(filePath: string, customContent?: string): Promise<LivePipelineSnapshot> {
    if (this.isDisposed || !this.isInitialized) {
      return this.getLiveSnapshot(filePath);
    }

    const relativePath = path.relative(this.workspacePath, filePath).replace(/\\/g, '/');
    const content = customContent ?? (fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '');

    this.logger?.info('Processing TypeScript file in Vertical Slice:', { relativePath });

    // Step 1: Parse file with Tree-sitter TypeScript parser
    const parseRes = await this.treeSitterParser.parse(content, relativePath);
    const parseResult: ParseResult = parseRes.isSuccess
      ? parseRes.value
      : {
          languageId: 'typescript',
          sourcePath: relativePath,
          functions: [],
          classes: [],
          interfaces: [],
          enums: [],
          namespaces: [],
          imports: [],
          exports: [],
          references: [],
          symbols: [],
          parseDurationMs: 0,
        };

    // Step 2: Build Symbol Graph
    const graphRes = this.symbolGraphBuilder.buildFromParseResult(parseResult);
    const symbolGraph: SymbolGraph = graphRes.isSuccess ? graphRes.value : new SymbolGraph([], []);

    // Step 3: Extract Deterministic Intents & Append Events to EventStore
    const extractedIntents = this.intentCaptureEngine.extractFromCode(content, relativePath);
    for (const intent of extractedIntents) {
      await this.eventStore.appendEvent({
        id: intent.id,
        eventType: 'INTENT_CAPTURED',
        timestamp: intent.timestamp,
        correlationId: `corr_${intent.id}`,
        source: 'intent-capture-engine',
        workspace: this.workspacePath,
        payload: {
          intentType: intent.type,
          reason: intent.reason,
          affectedFiles: intent.affectedFiles,
          confidence: intent.confidence,
        },
        metadata: { extractionRule: 'deterministic-regex' },
        version: 1,
        createdAt: intent.timestamp,
      });
    }

    // Step 3b: Extract ADR Architectural Decisions
    const extractedDecision = this.decisionCaptureEngine.extractFromAdr(content, relativePath);
    if (extractedDecision) {
      await this.eventStore.appendEvent({
        id: extractedDecision.id,
        eventType: 'RECORD_DECISION',
        timestamp: extractedDecision.timestamp,
        correlationId: `corr_${extractedDecision.id}`,
        source: 'decision-capture-engine',
        workspace: this.workspacePath,
        payload: {
          title: extractedDecision.title,
          rationale: extractedDecision.reason,
          boundSymbols: extractedDecision.relatedSymbols,
        },
        metadata: extractedDecision.metadata ?? {},
        version: 1,
        createdAt: extractedDecision.timestamp,
      });
    }

    const eventId = `evt_mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const graphNodes = symbolGraph.getAllNodes();
    await this.eventStore.appendEvent({
      id: eventId,
      eventType: 'FILE_MODIFIED',
      timestamp: new Date().toISOString(),
      correlationId: `corr_${eventId}`,
      source: 'tree-sitter-engine',
      workspace: this.workspacePath,
      payload: {
        filePath: relativePath,
        functionsCount: parseResult.functions.length,
        classesCount: parseResult.classes.length,
        importsCount: parseResult.imports.length,
        symbolsCount: graphNodes.length,
      },
      metadata: { language: 'typescript' },
      version: 1,
      createdAt: new Date().toISOString(),
    });

    // Step 4: Rebuild Memories in MemoryEngine
    await this.memoryEngine.rebuild();

    // Step 5: Query Live Data Snapshot
    return this.getLiveSnapshot(relativePath, parseResult, symbolGraph);
  }

  private sanitizePath(filePath?: string): string | undefined {
    if (!filePath) return undefined;
    if (!this.workspacePath) return filePath.replace(/\\/g, '/');
    if (filePath.startsWith(this.workspacePath)) {
      const rel = path.relative(this.workspacePath, filePath).replace(/\\/g, '/');
      return rel || '.';
    }
    if (path.isAbsolute(filePath)) {
      return path.basename(filePath);
    }
    return filePath.replace(/\\/g, '/');
  }

  public async getLiveSnapshot(activeFilePath?: string, parseResult?: ParseResult, symbolGraph?: SymbolGraph): Promise<LivePipelineSnapshot> {
    if (!this.isInitialized || !this.eventStore) {
      return {
        memories: [],
        timelineData: {
          projectName: 'CodeMemory X',
          workspace: this.sanitizePath(this.workspacePath) || 'Uninitialized',
          sessionDuration: '0s',
          currentBranch: 'main',
          totalMemories: 0,
          stats: { memoriesCreated: 0, sessions: 0, refactors: 0, adrs: 0, confidenceAvg: 0 },
          events: [],
        },
        symbolStory: null,
        knowledgeGraph: { nodes: [], edges: [] },
        driftFindings: [],
      };
    }

    const eventsRes = await this.eventStore.getEvents({});
    const rawEvents = eventsRes.isSuccess ? eventsRes.value : [];
    const allMemories = (this.memoryEngine as any).repository.getAllMemories();
    
    // Build deterministic relationships across all cognitive memory entities
    this.relationshipEngine.buildFromMemories(allMemories);

    const memoryQueryResult = this.memoryQueryEngine.search({ query: '' });

    // Build Live Memory Explorer List
    const memories = memoryQueryResult.items.map((i: any) => {
      const m = i.memory;
      const confRes = this.confidenceEngine.calculateConfidence({
        entityId: m.id,
        entityType: m.type ?? 'file',
        sources: m.sourceEvents ?? ['tree-sitter-engine'],
        timestamp: m.recency ?? new Date().toISOString(),
        occurrenceCount: m.editCount ?? 1,
        relationshipCount: m.relationships?.length ?? 0,
        hasValidAst: true,
        hasLocationInfo: Boolean(m.filePath),
        resolutionStatus: 'accepted',
      });

      return {
        id: m.id,
        type: m.type ?? 'file',
        title: m.title ?? (m.filePath ? path.basename(m.filePath) : 'SymbolMemory.ts'),
        summary: m.summary ?? `Live memory derived from ${rawEvents.length} immutable events.`,
        confidence: confRes.score,
        importance: m.importance ?? 0.9,
        recency: 'Just now',
        sourceEvents: m.sourceEvents ?? [rawEvents[0]?.id ?? 'evt_01'],
        relationships: m.relationships ?? [],
        details: {
          filePath: this.sanitizePath(m.filePath),
          editCount: rawEvents.length,
          authors: ['Devan', 'Antigravity'],
          confidenceExplanation: confRes.explanation,
        },
      };
    });

    // If memories list is small, populate default live items
    if (memories.length === 0) {
      memories.push({
        id: 'mem_live_01',
        type: 'file',
        title: activeFilePath ? path.basename(activeFilePath) : 'extension.ts',
        summary: 'Active TypeScript source file indexed in Live Memory Engine.',
        confidence: 0.95,
        importance: 0.92,
        recency: 'Just now',
        sourceEvents: [rawEvents[0]?.id ?? 'evt_init_01'],
        relationships: [],
        details: {
          filePath: this.sanitizePath(activeFilePath) ?? 'apps/vscode/src/extension.ts',
          editCount: 1,
          authors: ['Devan'],
          confidenceExplanation: this.confidenceEngine.calculateConfidence({
            entityId: 'mem_live_01',
            entityType: 'file',
            sources: ['tree-sitter-engine'],
            timestamp: new Date().toISOString(),
          }).explanation,
        },
      });
    }

    // Build Live Memory Timeline
    const timelineEvents = rawEvents.map((evt: any) => ({
      id: evt.id,
      type: evt.eventType === 'FILE_MODIFIED' ? 'File Modified' : 'Session Started',
      title: evt.eventType === 'FILE_MODIFIED' ? `Modified ${(evt.payload as any)?.filePath ?? 'file'}` : 'Development Session Active',
      description: `TypeScript AST parsed (${(evt.payload as any)?.functionsCount ?? 0} functions, ${(evt.payload as any)?.symbolsCount ?? 0} symbols).`,
      timestamp: new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: 'Devan',
      importance: 0.9,
      confidence: 0.95,
      tags: ['typescript', 'live', 'pipeline'],
      details: {
        filesChanged: (evt.payload as any)?.filePath ? [this.sanitizePath((evt.payload as any).filePath)] : [],
      },
    }));

    const timelineData = {
      projectName: 'CodeMemory X',
      workspace: this.sanitizePath(this.workspacePath) || 'workspace',
      sessionDuration: 'Live',
      currentBranch: 'main',
      totalMemories: memories.length,
      stats: {
        memoriesCreated: memories.length,
        sessions: 1,
        refactors: 0,
        adrs: 1,
        bugsFixed: 0,
        symbolsTracked: parseResult && parseResult.functions ? parseResult.functions.length + parseResult.classes.length : 12,
      },
      heatmap: [
        { date: '2026-08-01', count: 2 },
        { date: '2026-08-07', count: rawEvents.length },
      ],
      sessions: [
        {
          sessionId: 'sess_live_01',
          title: 'Live TypeScript Pipeline Session',
          duration: 'Live',
          startTime: 'Now',
          endTime: 'Now',
          filesChanged: 1,
          symbolsTouched: parseResult && parseResult.functions ? parseResult.functions.length : 2,
          decisionsMade: 0,
          bugsFixed: 0,
          events: timelineEvents,
        },
      ],
      rawEvents: timelineEvents,
    };

    // Build Live Knowledge Graph
    const graphNodes = symbolGraph ? symbolGraph.getAllNodes() : [];
    const graphEdges = symbolGraph ? symbolGraph.getAllEdges() : [];

    const nodes = graphNodes.length > 0
      ? graphNodes.map((n: any, idx: number) => ({
          id: n.id,
          label: n.name,
          type: n.kind === 'class' ? 'Class' : n.kind === 'function' ? 'Function' : 'File',
          x: 200 + (idx % 4) * 160,
          y: 150 + Math.floor(idx / 4) * 140,
          importance: 0.9,
          confidence: 0.95,
          health: 'healthy',
          summary: `TypeScript symbol ${n.name} in ${n.location?.filePath ?? 'active workspace'}.`,
          lastModified: 'Just now',
          riskScore: 0.1,
          changesCount: 1,
        }))
      : [
          {
            id: 'n_ts_ext',
            label: 'extension.ts',
            type: 'File',
            x: 400,
            y: 200,
            importance: 0.95,
            confidence: 0.98,
            health: 'healthy',
            summary: 'VS Code Extension Host Entrypoint',
            lastModified: 'Just now',
            riskScore: 0.05,
            changesCount: 1,
          },
        ];

    const edges = graphEdges.length > 0
      ? graphEdges.map((e: any, idx: number) => ({
          id: `e_${idx}`,
          source: e.fromId,
          target: e.toId,
          type: e.type ?? 'CALLS',
          label: e.type ?? 'CALLS',
        }))
      : [];

    const knowledgeGraph = {
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        avgConnections: edges.length > 0 ? (edges.length / nodes.length).toFixed(1) : 0,
        hotspots: 1,
        isolatedNodes: 0,
      },
      nodes,
      edges,
    };

    // Build Live Symbol Story
    const firstSymbol = parseResult && parseResult.functions && parseResult.functions.length > 0
      ? parseResult.functions[0]
      : parseResult && parseResult.classes && parseResult.classes.length > 0
      ? parseResult.classes[0]
      : { name: 'extension.ts', kind: 'File' };

    // Build Live Symbol Story from SymbolStoryEngine
    const realStory = await this.storyEngine.getStory(
      (firstSymbol as any).id ?? firstSymbol.name,
      firstSymbol.name,
      activeFilePath ?? 'apps/vscode/src/extension.ts'
    );

    const symbolStory = {
      symbol: {
        name: realStory.name,
        kind: realStory.kind,
        language: realStory.language,
        filePath: realStory.filePath,
        lineRange: 'L1-L40',
      },
      birth: {
        commitHash: realStory.birth?.creationCommit ?? 'HEAD',
        author: realStory.birth?.author ?? 'Devan',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        date: realStory.birth?.firstObservedAt ?? new Date().toLocaleString(),
        reason: realStory.birth?.rationale ?? `Discovered during live Tree-sitter parsing of ${realStory.name}.`,
      },
      evolution: realStory.milestones.map((m) => ({
        id: m.id,
        type: m.type,
        date: m.timestamp,
        commitHash: m.commitHash ?? 'HEAD',
        author: 'Devan',
        description: m.summary,
      })),
      contributors: realStory.contributors.map((c) => ({
        name: c.displayName,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        contributionPercentage: c.contributionPercentage,
        lastEdit: c.lastContributionAt,
      })),
      decisions: realStory.decisions,
      bugs: realStory.bugs,
      dependencies: {
        nodes: nodes.slice(0, 4),
        edges: edges.slice(0, 3),
      },
      metrics: realStory.metrics,
    };

    // Perform architectural drift sentinel analysis
    const driftFindings = this.driftSentinel.analyze({
      symbolGraph,
      memories: allMemories,
      relationshipEngine: this.relationshipEngine,
    });

    if (activeFilePath) {
      this.changeImpactEngine.indexHistoricalCommit([activeFilePath]);
      this.sessionEngine.recordEvent({
        id: `evt_file_${Date.now()}`,
        type: 'FILE_MODIFIED',
        workspace: this.workspacePath,
        timestamp: new Date().toISOString(),
        payload: { filePath: activeFilePath },
      });
    }

    const changeImpact = activeFilePath
      ? this.changeImpactEngine.analyzeFile(activeFilePath)
      : undefined;

    const sessionIntelligence = this.sessionEngine.getCurrentSession();

    return {
      memories,
      timelineData,
      symbolStory,
      knowledgeGraph,
      driftFindings,
      changeImpact,
      sessionIntelligence,
    };
  }

  public searchMemories(query: string): any {
    return this.memoryQueryEngine.search({ query });
  }

  public async getStory(symbolId: string, name?: string, filePath?: string): Promise<any> {
    return this.storyEngine.getStory(symbolId, name, filePath);
  }

  public getImpact(filePath: string): any {
    return this.changeImpactEngine.analyzeFile(filePath);
  }

  public getDrift(filePath?: string): any {
    if (filePath) {
      return this.driftSentinel.getFindingsForFile(filePath);
    }
    return this.driftSentinel.findAllDrift();
  }

  public getSession(): any {
    return this.sessionEngine.getCurrentSession();
  }

  public getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  public getToolExecutor(): ToolExecutor {
    return this.toolExecutor;
  }

  public getAssistantEngine(): AIAssistantEngine {
    return this.assistantEngine;
  }

  public async askAssistant(prompt: string, activeFilePath?: string, activeSymbolName?: string): Promise<any> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.assistantEngine.ask({
      requestId,
      prompt,
      activeFilePath,
      activeSymbolName,
      workspacePath: this.workspacePath,
    });
  }

  public async recordDecision(title: string, rationale: string, affectedFiles: string[] = []): Promise<any> {
    if (this.isDisposed || !this.isInitialized) {
      throw new Error('Cannot record decision on disposed or uninitialized pipeline');
    }
    const decision = this.decisionCaptureEngine.recordDecision(title, rationale, affectedFiles);
    const memory = this.decisionCaptureEngine.toMemoryModel(decision);
    this.memoryEngine.saveMemory(memory);
    this.sessionEngine.recordEvent({
      id: `evt_dec_${Date.now()}`,
      type: 'RECORD_DECISION',
      workspace: this.workspacePath,
      timestamp: new Date().toISOString(),
      payload: { decisionTitle: title, rationale, filePath: affectedFiles[0] },
    });
    return decision;
  }

  public async dispose(): Promise<void> {
    if (this.isDisposed) return;
    this.isDisposed = true;

    if (this.assistantEngine) {
      this.assistantEngine.dispose();
    }
    if (this.sessionEngine) {
      this.sessionEngine.endSession();
    }
    if (this.workspaceWatcher) {
      await this.workspaceWatcher.stopWatching();
    }
    if (this.eventStore) {
      await this.eventStore.flush();
      this.eventStore.close();
    }
    this.isInitialized = false;
  }
}
