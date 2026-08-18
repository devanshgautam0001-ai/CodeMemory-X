# Changelog

All notable changes to CodeMemory X will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha] - 2026-08-14

### Added
- **Final Pre-Release Failure-Injection Audit Pass:**
  - Hardened `AIAssistantEngine` conversation deletion and clearing — `deleteConversation()` and `clearConversation()` now invoke `cancelConversationApprovals()`, ensuring pending tool approvals settle with `'CANCELLED'` on conversation delete/clear.
  - Added cancellation signal support to `DefaultRetryPolicy.executeWithRetry()` — backoff delay sleep listens to `signal.aborted` and rejects immediately with `ABORTED` error on user cancellation.
  - Hardened `InMemoryEventBus` subscription registration — `subscribe()` checks handler existence to prevent duplicate handler registrations for the same handler function.
  - Added post-closure guard to `EventStore.ts` — `close()` sets `isClosed = true`, causing subsequent `initialize()`, `appendEvent()`, `appendBatch()`, and query calls to return `fail(new Error('EventStore is closed'))` cleanly rather than re-opening closed databases.
  - Added post-disposal guards to `VerticalSlicePipeline.ts` — `executeProcessFile()` and `recordDecision()` reject or return current live snapshot safely when invoked after disposal.
  - Added 5 focused regression test files covering all failure-injection audit fixes.
  - Hardened `ToolApprovalManager` `clearAll()` / `dispose()` resolution order — `cancelAllPending()` now executes prior to `resolvers.clear()`, ensuring pending `waitForApproval()` promises settle cleanly with `'CANCELLED'` on shutdown.
  - Propagated `controller.signal` to `activeProvider.generateStream(...)` and `activeProvider.generate(...)` in `AIAssistantEngine.ts` — guarantees active LLM HTTP requests are aborted on user cancellation or disposal.
  - Hardened `HttpTransport.ts` `postStream()` — preserved `userSignal` `'abort'` listener throughout stream reading in `postStream()`, ensuring stream reader aborts immediately when caller signal triggers.
  - Mapped `SyntaxError` in `HttpTransport.ts` `postJson()` to `code: 'INVALID_RESPONSE', retryable: false`.
  - Added capacity bounds to long-lived in-memory repositories: `StoryRepository` (1,000 symbol stories), `CoChangeIndex` (2,000 files / 5,000 pairs), `SessionRepository` (200 sessions), `DriftRepository` (500 drift findings), and `ImpactRepository` (500 impact maps).
  - Hardened `WebviewRpcClient.ts` with 500 request / 100 stream callback capacity bounds, command mismatch rejection during response correlation, and added `dispose()` method.
  - Fixed `VerticalSlicePipeline` promise chain error recovery — `processTypeScriptFile()` intercepts rejections in `this.processingPromise` so uncaught file errors do not permanently break future file processing.
  - Added double-initialization check to `DatabaseProvider.ts` `initialize()` returning `ok(this.db)` if database is already non-null.
  - Capped `assistantMessages` array length to 1,000 items in `useDashboardStore.ts`.
  - Added 11 focused regression test files covering all confirmed audit fixes.

- **TASK-059 & Production Readiness Hardening Pass (Pass 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 & 12):**
  - Hardened `cancel()`, `cancelAll()`, and `dispose()` in `AIAssistantEngine` — resolves `assistantEngine.cancel is not a function` error on `CANCEL_ASSISTANT` RPC call and guarantees streaming request abort and tool approval cancellation on shutdown.
  - Implemented `vscode.Disposable` in `SidebarWebviewProvider` — prevents duplicate `onDidSaveTextDocument` listeners across webview view re-resolutions and ensures webview view disposal cleans up disposables.
  - Updated `extension.ts` `deactivate()` — registered `sidebarProvider` in extension context subscriptions and ensured async `sidebarProvider.dispose()` flushes EventStore WASM SQLite database to disk on extension host exit.
  - Hardened `VerticalSlicePipeline` initialization & error handling — handled `eventStore.initialize()` `Result`, added outer try-catch recovery, added `isInitialized` guard to `getLiveSnapshot()`, and added `isDisposed` flag for idempotent teardown.
  - Added zero-host-path boundary sanitization — `sanitizePath()` converts local home directory absolute paths (`c:\Users\...`) to workspace-relative or basename format across Webview RPC snapshots.
  - Fixed status recording bug in `ToolExecutor.ts` line 147 — tool handler execution failure results (`success: false`) are now accurately audited as `FAILED` with `errorCode` instead of being recorded as `COMPLETED`.
  - Activated missing `DELETE_ASSISTANT_CONVERSATION` command in `MessageBridge.ts` `validCommands` Set.
  - Added 2MB RPC payload size guard returning `PAYLOAD_TOO_LARGE` for oversized Webview RPC requests.
  - Added RPC error message sanitization in `MessageBridge.ts` — `sanitizeErrorMessage()` redacts API key tokens and absolute host system filesystem paths (`C:\Users\...`, `/home/...`) from all Webview RPC error responses.
  - Added duplicate request overwrite protection in `WebviewRpcClient.ts` `sendRequest()`, rejecting superceded pending requests with `RPC_STALE_REQUEST`.
  - Added post-closure teardown guard `if (!this.db) return;` to `DatabaseProvider.ts` `saveToDisk()`.
  - Hardened EventStore statement management in `EventRepository.ts` — wrapped statement step loops in `try...finally { stmt.free(); }` and added graceful recovery for malformed `payload_json` / `metadata_json`.
  - Enforced in-memory cache bounds in `ToolExecutionRepository.ts` (10,000 records), `DefaultTokenAccounting` (5,000 records), `ToolApprovalManager.ts` (5,000 records), and `AssistantConversationRepository.ts` (500 conversations / 1,000 messages) to bound Extension Host memory consumption during long-running sessions.
  - Added cancellation signal propagation to `IAIRequest.signal` in `ToolCallOrchestrator.ts`.
  - Optimized token pruning loop in `ContextCompressor.ts` from quadratic stringification to linear token subtraction.
  - Added `isNaN(expTime)` check in `ToolApprovalRepository.ts` `getPendingApprovals()`.
  - Added `isNaN(recencyTime)` guard in `ContextRanker.ts` to prevent comparator `NaN` sorting breakage.
  - Extended formula injection regex in `ToolExecutionRepository.ts` `exportToCsv()` to `/^[=+\-@\t\r]/`.
  - Updated `SystemPromptBuilder.ts` to handle string primitive arrays and object arrays for activeFiles without rendering empty comma strings.
  - Added `safeNumBuckets` fallback in `ToolExecutionRepository.ts` `computeVisualization()` for `undefined`, `null`, or `NaN` bucket inputs.
  - Wrapped `rpcMetricsProvider` call in `SystemHealthAggregator.ts` in try-catch with zero-value fallback when provider throws or returns null/undefined.
  - Added parameter validation to `ToolExecutionAuditor.ts` `getTimeline()` ensuring non-negative, non-NaN limits.
  - Updated `ToolCallStateMachine.ts` `isValidTransition()` to prevent state transitions out of terminal states (`COMPLETED`, `FAILED`, `DENIED`).
  - Added 5,000 entry eviction bound to `this.requestSequences` in `ToolExecutionRepository.ts` `nextSequence()`.
  - Added 30-day range limit clamping relative to `Date.now()` when `fromTimestamp` is specified without `toTimestamp` in `normalizeAnalyticsFilter.ts`.
  - Added 26 focused test suites: `extensionLifecycleHardening.test.ts`, `assistantCancelAndDispose.test.ts`, `pipelineErrorSafety.test.ts`, `toolAuditFailureRecording.test.ts`, `rpcErrorSanitization.test.ts`, `eventStoreCorruptRecovery.test.ts`, `messageBridgeBoundary.test.ts`, `tokenAccountingBounds.test.ts`, `toolApprovalBounds.test.ts`, `dbTeardownSafety.test.ts`, `rpcDuplicateRequestHandling.test.ts`, `pipelineIdempotentDispose.test.ts`, `assistantConversationBounds.test.ts`, `orchestratorSignalPropagation.test.ts`, `contextCompressorEfficiency.test.ts`, `approvalExpirationRecovery.test.ts`, `contextRankerDeterminism.test.ts`, `csvControlInjection.test.ts`, `promptBuilderFormatting.test.ts`, `visualizationBucketBounds.test.ts`, `healthAggregatorSafety.test.ts`, `auditorTimelineBounds.test.ts`, `stateMachineTerminalImmutability.test.ts`, `repositorySequenceBounds.test.ts`, `orchestratorAbortCheck.test.ts`, `filterUnboundedFromTimestamp.test.ts`.
  - Monorepo validation: Build 29/29 ✅ · All tests ✅ · Lint 29/29 ✅ · Typecheck 56/56 ✅.

- **Task-058: Production Observability & System Health Dashboard:**
  - Added `SystemHealth.ts` DTOs (`ComponentHealthInfo`, `SystemHealthSnapshot`).
  - Added `SystemHealthAggregator` evaluating EventStore, AI Provider, Tool Runtime, RPC Bridge, and Cognitive Engines.
  - Added `GET_SYSTEM_HEALTH` and `REFRESH_SYSTEM_HEALTH` Webview RPC commands.
  - Added System Health Dashboard view in `AssistantView.tsx` with status badges, summary counts, component cards, expandable details, and manual refresh.
  - Added 15 unit & integration tests in `systemHealth.test.ts`.

- **Task-057: Production Analytics Dashboard Polish & Reliability:**
  - Added `normalizeAnalyticsFilter` central filter normalization module enforcing 30-day range ceilings and timestamp validation.
  - Applied `normalizeAnalyticsFilter` across `ToolExecutionRepository` methods and `MessageBridge` RPC handlers.
  - Hardened SVG visualization chart calculations for zero-value, 1-bucket, and large-number edge cases.
  - Added RPC error alert banner, Retry controls, and ARIA live accessibility regions in `AssistantView.tsx`.
  - Added 15 unit & integration tests in `analyticsReliability.test.ts`.

- **Task-056: Production Analytics Export & Reporting Hardening:**
  - Enforced full 7-filter consistency and CSV formula injection protection (`=, +, -, @`).
  - Added structured JSON report interfaces `ToolExecutionReportJson` and `ToolExecutionReportMetadata`.
  - Added `EXPORT_TOOL_EXECUTIONS_REPORT` RPC endpoint.
  - Added Webview Report Preview & Export UX panel with loading states and ARIA status announcements.
  - Added 15 unit & integration tests in `analyticsExport.test.ts`.

- **Task-055: Production Analytics Dashboard Hardening & Drill-Down:**
  - Added interactive SVG bucket selection with active stroke outline and keyboard `Enter`/`Space` activation.
  - Built Bucket Detail Inspector Panel with interval bounds, execution counts, latency stats, success rate, and "Filter Timeline to Bucket" trigger.
  - Added bounded `selectedBucketIndex` state to `useDashboardStore.ts`.
  - Added 13 unit & integration tests in `analyticsDrilldown.test.ts`.

- **Task-054: Production Analytics Dashboard Polish & Interactive Visualization Hardening:**
  - Extended DTOs in `AnalyticsVisualization.ts` and `ToolExecutionRepository.ts` to compute 10 deterministic series with 0-value empty bucket preservation and 500-bucket limit.
  - Added request ID tracking in `useDashboardStore.ts` to discard stale async RPC responses.
  - Upgraded SVG chart in `AssistantView.tsx` with responsive viewBox, dual Y-axes, interactive legend toggles (min 1 visible series enforced), focusable inspection tooltips, and screen reader summary ARIA text.
  - Added 30 unit & integration tests in `analyticsVisualization.test.ts`.

- **Task-046: Production Tool Approval UX & Human-in-the-Loop Execution:**
  - Implemented `ToolApprovalManager` and approval state lifecycle (`NOT_REQUIRED`, `PENDING`, `APPROVED`, `DENIED`, `EXPIRED`, `CANCELLED`).
  - Integrated `REQUIRE_CONFIRMATION` execution pausing in `ToolExecutor.ts`.
  - Added `RESPOND_TOOL_APPROVAL` command to `WebviewProtocol.ts`, `MessageBridge.ts`, and `AIAssistantEngine.ts`.
  - Built interactive Tool Confirmation Request cards in `AssistantView.tsx`.

- **Task-045: Production AI Assistant Tool-Calling & Streaming Orchestration Hardening:**
  - Implemented `ToolCallStateMachine` tracking explicit lifecycle states (`IDLE`, `REQUESTING`, `TOOL_CALL_RECEIVED`, `PERMISSION_CHECK`, `EXECUTING`, `TOOL_RESULT`, `FOLLOWUP_REQUEST`, `STREAMING`, `COMPLETED`, `FAILED`, `DENIED`).
  - Integrated state machine validation into `ToolCallOrchestrator.ts`.

- **Task-044: Deterministic Context Evidence & Budget Enforcement Hardening:**
  - Added `evidenceBudgetHardening.test.ts` verifying priority-aware context ranking, budget pruning thresholds, and evidence system prompt annotations.
  - Updated `SystemPromptBuilder.ts` to include `[CRITICAL | Score X.Y]` evidence annotations.
  - Hardened `ContextCompressor.ts` context pruning thresholds.

- **Task-043: Assistant Retrieval Quality & Context Validation:**
  - Upgraded `ContextRanker.ts` with Priority Bucketing (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and multi-level deterministic sorting comparator (`priority -> score -> confidence -> recency -> id`).
  - Upgraded `ContextCompressor.ts` to perform priority-aware budget compression.
  - Added Priority badge rendering to Webview Context Inspector drawer.

- **Task-042: Assistant Context Quality, Budget & Evidence Hardening:**
  - Upgraded `ContextRanker.ts` to evaluate all 10 relevance signals (symbol match, file match, conversation reference, current session, memory relationship, decision relationship, architectural risk, change blast radius, recency, confidence).
  - Added `evidenceScores` to `AssistantContext` and relevance score rendering in Webview Context Inspector drawer.
  - Upgraded `ContextCompressor.ts` to perform score-based context pruning during budget compression.

- **Task-041: Assistant Context Intelligence & Conversation-Aware Retrieval:**
  - Implemented `ContextRanker` for deterministic relevance scoring across active symbol match, active file match, conversation reference, confidence, and recency signals.
  - Upgraded `ContextCollector` to perform conversation-aware context ranking across workspace memories, decisions, and drift findings.

- **Task-040: Production Conversation UX & Assistant Reliability:**
  - Upgraded `WebviewRpcClient` with deterministic `RpcErrorCode` types (`RPC_TIMEOUT`, `RPC_CANCELLED`, `RPC_INVALID_RESPONSE`, `RPC_CONNECTION_ERROR`, `RPC_STALE_REQUEST`), stream inactivity timers, and `cancelRequest()`.
  - Added race-condition filters in `useDashboardStore.ts` preventing stale stream chunks and message bleeding across conversation switches.

- **Task-039: Production AI Assistant Persistence & Conversation Management:**
  - Persisted assistant conversations to `EventStore` (`events.db`) using deterministic event types (`ASSISTANT_CONVERSATION_CREATED`, `ASSISTANT_MESSAGE_ADDED`, `ASSISTANT_CONVERSATION_CLEARED`, `ASSISTANT_CONVERSATION_DELETED`).
  - Added startup event rehydration (`rehydrateFromEventStore`) in `VerticalSlicePipeline`.
  - Added Webview RPC commands `LIST_ASSISTANT_CONVERSATIONS`, `CREATE_ASSISTANT_CONVERSATION`, `SWITCH_ASSISTANT_CONVERSATION`, and `DELETE_ASSISTANT_CONVERSATION`.
  - Built Conversation Management UI drawer in `AssistantView.tsx`.

- **Task-038: Production AI Assistant Reliability, Persistence & UX Hardening:**
  - Implemented `GET_ASSISTANT_CONVERSATION` Webview RPC command enabling Webview conversation restoration upon tab reloads or workspace focus events.
  - Added `providerSwitching.test.ts` verifying dynamic provider adapter resolution.

- **Task-037: Production AI Assistant Integration Verification & Release Hardening:**
  - Hardened dynamic provider resolution (`resolveProvider`) allowing Webview provider/model selection to instantiate target adapters on-demand via `AIProviderFactory`.
  - Verified error recovery boundaries and end-to-end token streaming.

- **Task-036: Production AI Assistant UX & Reliability:**
  - Enhanced Webview `AssistantView` with smart auto-scroll detection, floating new message pill, interactive prompt suggestion chips, modal clear confirmation, expandable read-only tool cards, token budget progress bar, context item filter, and inline error retry controls.

- **Task-035: AI Assistant Production Hardening & Real Streaming Verification:**
  - Added `STREAM_ASSISTANT` RPC command and `ASSISTANT_STREAM_CHUNK` real-time message broadcasting bridge.
  - Hardened React Webview `AssistantView` and `WebviewRpcClient` with `streamRequest()` for real token delta rendering and mid-stream cancellation.

- **Task-034: Production AI Assistant Webview Experience:**
  - Extended typed Webview RPC protocol (`ASK_ASSISTANT`, `CANCEL_ASSISTANT`, `GET_ASSISTANT_CONTEXT`, `CLEAR_ASSISTANT_CONVERSATION`) and MessageBridge routing.
  - Implemented `AssistantView` React Webview component with provider/model controls, tool runtime toggles, empirical Context Inspector Drawer, and interactive composer.

- **Task-033: Production AI Coding Assistant & Context Orchestrator:**
  - Created `@codememory/ai-assistant` package providing deterministic context collection (`ContextCollector`), prompt budgeting (`PromptBudgetManager`), context compression (`ContextCompressor`), system prompt formatting (`SystemPromptBuilder`), and full tool orchestration (`AIAssistantEngine`).
  - Integrated `AIAssistantEngine` into Extension Host (`apps/vscode`).

- **Task-032: Tool Runtime & AI Tool Orchestration Engine:**
  - Created `@codememory/tool-runtime` package layered deterministically above `@codememory/ai-provider`.
  - Implemented $O(1)$ `ToolRegistry`, prototype pollution-proof `ToolExecutionValidator`, secure-by-default `ToolPermissionManager`, `SequentialToolExecutor`, and `ParallelToolExecutor`.
  - Implemented `ToolTimeoutController`, cancellation support via `AbortSignal`, secret-redacted `ToolExecutionAuditor`, and `@codememory/event-bus` execution event publishing.
  - Implemented `ToolCallOrchestrator` and `AgentLoopController` enforcing strict safety limits (`maxIterations: 8`, `maxToolCalls: 32`, `maxExecutionTimeMs: 120000`).
  - Registered 6 read-only built-in CodeMemory tools (`search_memories`, `get_symbol_story`, `get_change_impact`, `get_architectural_drift`, `get_session`, `get_relationships`).

- **Task-031: Production Tool & Function Calling Engine:**
  - Implemented normalized tool-calling types (`ToolDefinition`, `ToolCall`, `ToolResult`, `ToolChoiceOption`) and `ToolValidator`.
  - Implemented tool call payload transformations, response tool call parsing, and streaming `toolCallDelta` emission across OpenAI, Claude, Gemini, Ollama, LM Studio, Azure, OpenRouter, DeepSeek, Groq, and Mistral adapters.
  - Enforced strict tool execution boundary where AI Provider returns `ToolCall[]` without executing external side-effects.

- **Task-030: Production AI Provider REST Adapters & Resilient LLM Execution:**
  - Implemented production REST adapters in `@codememory/ai-provider` for OpenAI, Anthropic Claude, Google Gemini, Ollama, and LM Studio behind `IAIProvider`.
  - Built zero-dependency `HttpTransport` supporting POST requests, SSE stream parsing, and AbortController timeouts.
  - Built `AIProviderError` model with automatic API key and secret redaction.
  - Implemented `DefaultRetryPolicy`, `DefaultCircuitBreaker`, `DefaultRateLimiter`, `DefaultTokenAccounting`, and `DefaultRequestLogger`.

- **Task-029: Persistent EventStore Storage & Workspace Recovery Engine:**
  - Upgraded `@codememory/event-store` `DatabaseProvider` to support workspace-scoped disk persistence at `.codememory/events.db`.
  - Added atomic temporary file write replacement (`.codememory/events.db.tmp`) and debounced flushes.
  - Implemented versioned migration runner (`MigrationRunner`) tracking `PRAGMA user_version`.
  - Implemented automatic corruption backup recovery to `.codememory/events.db.corrupt.<timestamp>`.
  - Hardened `SidebarWebviewProvider.ts` with strict Webview `Content-Security-Policy` meta header.

- **Task-028: Production Webview RPC Bridge & Full Live UI Integration:**
  - Added strongly typed `WebviewProtocol` (`WebviewRpcRequest`, `WebviewRpcResponse`, `WebviewStateEvent`) to `@codememory/shared`.
  - Built RPC command validation and dispatching in `MessageBridge` supporting `REQUEST_SNAPSHOT`, `RECORD_DECISION`, `SEARCH_MEMORIES`, `GET_STORY`, `GET_IMPACT`, `GET_DRIFT`, `GET_SESSION`, `SWITCH_TAB`.
  - Added `WebviewRpcClient` in `apps/webview` for request promise tracking and timeout management.
  - Connected live `SessionPanel`, `DriftPanel`, and `ImpactPanel` into `DashboardView` displaying real Extension Host streams.

- **Task-027: Symbol Story Engine (`@codememory/story-engine`):**
  - Created deterministic Symbol Story Engine reconstructing symbol evolution history (`SymbolStory`, `StoryBirth`, `StoryMilestone`, `StoryContributor`, `StoryDecision`, `StoryBug`, `StoryRefactor`, `StoryDependency`, `StorySession`, `StoryMetrics`, `StoryRiskPoint`).
  - Implemented 10 modular extractors, `RenameMoveDetector`, and `StoryRepository` with selective file/symbol invalidation.
  - Connected live `SymbolStoryEngine` data directly into `StoryView` in `VerticalSlicePipeline`.

- **Task-026: Developer Session Intelligence Engine (`@codememory/session-intelligence`):**
  - Created deterministic session intelligence package reconstructing developer coding sessions from observable activity (`OBSERVED`, `INFERRED`, `UNKNOWN`).
  - Implemented session reconstruction (`SessionReconstructor`), 30-minute inactivity boundary detection (`SessionBoundaryDetector`), activity classification (`ActivityClassifier`), state classification (`SessionStateClassifier`), primary focus detection (`FocusClassifier`), and evidence-based confidence scoring.
  - Built `SessionPanel` component in `@codememory/ui` and integrated active session tracking into `VerticalSlicePipeline`.

- **Task-025: Change Impact Engine (`@codememory/change-impact`):**
  - Created deterministic Change Impact Engine supporting 13 impact types, 7-factor weighted scoring (`ImpactScorer`), configurable distance decay (`DistanceDecay`), and indexed historical co-change tracking (`CoChangeIndex`).
  - Integrated with `DriftSentinel`, `MemoryQueryEngine`, `ConfidenceEngine`, and published `CHANGE_IMPACT_ANALYZED` events on `EventBus`.
  - Built `ImpactPanel` component in `@codememory/ui` and integrated live impact maps into `VerticalSlicePipeline`.

- **Task-024: Architectural Drift Sentinel (`@codememory/drift-sentinel`):**
  - Created deterministic Architectural Drift Sentinel package detecting 10 drift types (`DEPENDENCY_DIRECTION_DRIFT`, `NEW_CYCLIC_DEPENDENCY`, `COUPLING_INCREASE`, `API_BOUNDARY_DRIFT`, `DIRECTORY_STRUCTURE_DRIFT`, `SYMBOL_RESPONSIBILITY_DRIFT`, `OWNERSHIP_DRIFT`, `ARCHITECTURAL_DECISION_VIOLATION`, `HOTSPOT_ESCALATION`, `RELATIONSHIP_PATTERN_DRIFT`).
  - Implemented `ArchitecturalBaselineBuilder` with deterministic SHA hashing and 7 modular analyzers.
  - Implemented 7-factor weighted scoring (`DriftScorer`), severity resolution (`SeverityResolver`), and `ARCHITECTURAL_DRIFT_DETECTED` event bus publishing.
  - Created `DriftPanel` component in `@codememory/ui` and wired live findings into `VerticalSlicePipeline`.

- **Task-023: Memory Confidence Engine (`@codememory/confidence-engine`):**
  - Created deterministic multi-signal confidence engine calculating explainable trust scores (0.0 — 1.0) with zero AI/LLM/probabilistic models.
  - Implemented 7 observable evidence evaluators: Source Reliability, Temporal Consistency, Relationship Strength, Cross-Source Agreement, Recency Decay, Structural Evidence, and Resolution Evidence.
  - Integrated with `VerticalSlicePipeline` to dynamically assign explainable confidence scores to live memory snapshot items.

- **Task-022: Relationship Engine (`@codememory/relationship-engine`):**
  - Created deterministic relationship engine linking 8 entity types (`Memory`, `Intent`, `Decision`, `Symbol`, `File`, `Session`, `Bug`, `Refactor`) across 14 relationship edge types.
  - Implemented graph navigation & pathfinding APIs: `findRelationships`, `findNeighbors`, `findPath` (BFS shortest path), and `findConnectedEntities`.
  - Integrated with `VerticalSlicePipeline` to enrich relationships across `Memory Explorer`, `Knowledge Graph`, `Story View`, and `Timeline`.

- **Task-021: Decision Capture Engine (`@codememory/decision-capture`):**
  - Created deterministic architectural decision capture engine with zero AI/NLP/embeddings dependency.
  - Implemented `AdrDecisionExtractor`, `CommitDecisionExtractor`, and `GraphDecisionExtractor` targeting ADR markdown files, conventional decision commits, package.json dependency changes, folder moves, and multi-file editing sessions.
  - Integrated `RECORD_DECISION` event processing in `MemoryEngine` (`MemoryBuilder.ts`) to derive `DecisionMemory` models rendered across `StoryView`, `TimelineView`, `MemoryExplorer`, and `KnowledgeGraphView`.

- **Task-020: Intent Capture Engine (`@codememory/intent-capture`):**
  - Created deterministic intent extraction engine with zero AI/LLM/embeddings dependency.
  - Implemented `CommentIntentExtractor`, `CommitIntentExtractor`, and `EventIntentExtractor` targeting 10 supported developer intent types (`Bug Fix`, `Refactor`, `Optimization`, `Cleanup`, `Experiment`, `Feature`, `Architecture`, `Documentation`, `Technical Debt`, `Temporary Workaround`).
  - Integrated `INTENT_CAPTURED` event processing inside `MemoryEngine` (`MemoryBuilder.ts`) to derive `DeveloperIntentMemory` instances exposed in `TimelineView`, `StoryView`, and `MemoryExplorer`.

- **Phase-2 Vertical Slice Integration:**
  - Implemented end-to-end working engine pipeline in `apps/vscode/src/pipeline/VerticalSlicePipeline.ts`.
  - Connected live TypeScript workspace scanning, Tree-sitter AST parsing, Symbol Graph construction, WASM SQLite Event Store persistence, Memory Engine replay, Memory Query indexing, Context Engine snapshot generation, and IPC Webview synchronization.
  - Replaced UI placeholder states with live pipeline snapshots across `MemoryExplorer`, `TimelineView`, `KnowledgeGraphView`, and `StoryView`.

- **Flagship Knowledge Graph Explorer Hero UI (Task-019):**
  - Created Obsidian/Neo4j/Figma-grade Knowledge Graph Explorer UI suite in `@codememory/ui`.
  - Built `KnowledgeGraphView`, `GraphCanvas`, `GraphNode`, `GraphEdge`, `InspectorDrawer`, `MiniMap`, `GraphSearch`, `GraphFilters`, `GraphLegend`, `GraphStatistics`.
  - Implemented infinite zoomable canvas, SVG animated edges with moving particle flows, 12 node classification styles, hover tooltips, layout mode switcher, node search & filtering, floating minimap, and inspector drawer.
  - Added mock graph dataset, Storybook stories in `src/stories/KnowledgeGraph.stories.tsx`, and component test suite.

- **Interactive Memory Timeline Experience UI (Task-018):**
  - Created Linear/Figma/Notion-grade Memory Timeline UI suite in `@codememory/ui`.
  - Built `TimelineView`, `TimelineHeader`, `TimelineSearch`, `TimelineFilters`, `StatisticsCards`, `Heatmap`, `TimelineCard`, `SessionGroup`, `TimelineDrawer`, `TimelineEmptyState`.
  - Supported 12 timeline event types (File Created, File Modified, Symbol Added, Symbol Renamed, Refactor, ADR Recorded, Bug Fixed, Dependency Added, Session Started, Session Ended, Release, Milestone).
  - Added session grouping, contribution heatmap, 6 metric summary cards, live search, multi-criteria filters, and detail drawer.
  - Added mock timeline dataset, Storybook stories in `src/stories/MemoryTimeline.stories.tsx`, and component test suite.

- **Symbol Story Inspector UI Experience (Task-017):**
  - Created signature `StoryView` inspector suite in `@codememory/ui`.
  - Built `StoryHeader`, `StoryBirth`, `StoryTimeline`, `StoryContributors`, `StoryDecisions`, `StoryBugs`, `StoryGraphPreview`, `StoryMetrics`, `StoryAiPlaceholder`.
  - Added evolution milestone cards (`Added`, `Renamed`, `Moved`, `Refactored`, `Deprecated`, `Restored`), author contribution meters, mini dependency graph preview, and AI prediction placeholder.
  - Added mock symbol story dataset, Storybook stories in `src/stories/SymbolStory.stories.tsx`, and component test suite.

- **Premium Memory Explorer Sidebar UI (Task-016):**
  - Created Raycast/Linear-grade Memory Explorer UI suite in `@codememory/ui`.
  - Built `MemoryExplorer`, `MemoryCard`, `MemoryDetailsPanel`, `RelationshipPanel`, `SessionTimelinePreview`, `DecisionPanel`, `BugPanel`, `RefactorPanel`, `SearchBar`, and `MemoryFilters`.
  - Implemented glassmorphic styling, Framer Motion micro-animations, type filtering, importance slider, and connected relationship navigation.
  - Added mock memory dataset, Storybook stories in `src/stories/MemoryExplorer.stories.tsx`, and component test suite.

- **AI Provider Abstraction Layer & Vendor Adapters (Task-015):**
  - Created package `@codememory/ai-provider` defining unified `IAIProvider` interface.
  - Built 10 scaffold adapters (`OpenAIProvider`, `ClaudeProvider`, `GeminiProvider`, `OllamaProvider`, `LMStudioProvider`, `AzureOpenAIProvider`, `OpenRouterProvider`, `DeepSeekProvider`, `GroqProvider`, `MistralProvider`).
  - Implemented `AIProviderFactory`, `ProviderRegistry`, `CapabilityResolver`.
  - Defined future resilience interfaces (`IRetryPolicy`, `ICircuitBreaker`, `IRateLimiter`, `ITokenAccounting`, `IRequestLogger`, `IResponseCache`).
  - Added unit test suite in `packages/ai-provider/src/__tests__/` with full V8 coverage report.

- **AI-Ready Context Engine & Token Budgeting (Task-014):**
  - Created package `@codememory/context-engine` converting developer focus into token-budgeted AI context packages.
  - Built `ContextEngine`, `ContextBuilder`, `ContextCompressor`, `ContextBudgetManager`, `ContextRanker`, `PromptContext`, `ContextSnapshot`.
  - Supported token budget presets (2K, 4K, 8K, 16K, 32K, 128K) with automatic trimming and memory compression.
  - Added unit test suite in `packages/context-engine/src/__tests__/` with full V8 coverage report.

- **Memory Query & Ranking Engine (Task-013):**
  - Created package `@codememory/memory-query` providing query, ranking, filtering, sorting, pagination, and grouping over `@codememory/memory-engine`.
  - Built `MemoryQueryEngine`, `QueryParser`, `QueryPlanner`, `RankingEngine`, `QueryExecutor`, `SearchResult`.
  - Implemented multi-factor ranking formula combining importance, confidence, exponential recency decay, and relationship connectivity.
  - Defined future-ready interfaces for NL queries, vector search, embeddings, and hybrid search (`INaturalLanguageQueryInterface`, `IVectorSearchAdapter`, `IEmbeddingAdapter`, `IHybridSearch`).
  - Added unit test suite in `packages/memory-query/src/__tests__/` with full V8 coverage report.

- **Core Memory Engine & Replay Models (Task-012):**
  - Created package `@codememory/memory-engine` deriving developer memory models from immutable event store events.
  - Defined memory types: `FileMemory`, `SymbolMemory`, `DecisionMemory`, `BugMemory`, `RefactorMemory`, `DeveloperIntentMemory`, `SessionMemory`.
  - Added future-ready fields (`confidence`, `importance`, `recency`, `relationships`, `sourceEvents`).
  - Built `MemoryEngine`, `MemoryBuilder`, `MemorySnapshot`, `MemoryIndex`, and `MemoryRepository`.
  - Implemented event replay from zero, deterministic key generation, and query APIs (`getMemory`, `getSymbolMemory`, `getFileMemory`, `getSessionMemory`, `searchMemory`).
  - Added unit test suite in `packages/memory-engine/src/__tests__/` with full V8 coverage report.

- **Append-Only Event Store Sourcing (Task-011):**
  - Created package `@codememory/event-store` providing SQLite event persistence using `better-sqlite3`.
  - Configured WAL mode (`PRAGMA journal_mode = WAL`), Foreign Keys (`PRAGMA foreign_keys = ON`), and `busy_timeout = 5000`.
  - Created `DatabaseProvider`, `MigrationRunner`, `EventRepository`, and `EventStore`.
  - Defined `events` table with index optimization on `timestamp`, `workspace`, `correlation_id`, and `event_type`.
  - Implemented `appendEvent`, `appendBatch` (single transaction), `getEvent`, `getEvents`, `getEventsByCorrelation`, `getEventsByWorkspace`, `streamEvents`, `replay`.
  - Enforced strict immutability (zero update/delete APIs).
  - Added unit test suite in `packages/event-store/src/__tests__/` with full V8 coverage report.

- **Code Intelligence Pipeline Orchestration (Task-010):**
  - Created package `@codememory/intelligence-pipeline` coordinating workspace watcher, git engine, parser SDK, tree-sitter engine, symbol graph, and event bus.
  - Implemented 7 pipeline stages (`DetectWorkspaceEventStage`, `ResolveRepositoryStage`, `DetermineChangedFilesStage`, `SelectParserStage`, `ParseFilesStage`, `BuildSymbolGraphStage`, `PublishPipelineEventsStage`).
  - Built `PipelineContext`, `PipelineExecutor`, `PipelineCoordinator`, and `PipelineMetrics`.
  - Added unit test suite in `packages/intelligence-pipeline/src/__tests__/` with full V8 coverage report.

- **Symbol Graph Builder & Query APIs (Task-009):**
  - Created package `@codememory/symbol-graph` transforming `ParseResult` objects into directed symbol graphs.
  - Implemented `generateDeterministicSymbolId` producing stable SHA-256 symbol keys.
  - Supported relationship edge types (`CALLS`, `IMPLEMENTS`, `EXTENDS`, `IMPORTS`, `EXPORTS`, `USES`, `DECLARES`, `RETURNS`, `DEPENDS_ON`).
  - Implemented queryable immutable `SymbolGraph` (`getNode`, `getEdges`, `findDependents`, `findDependencies`, `findCallers`, `findCallees`).
  - Added unit test suite in `packages/symbol-graph/src/__tests__/` with full V8 coverage report.

- **Tree-sitter Parsing Engine (Task-008):**
  - Created package `@codememory/tree-sitter-engine` implementing `@codememory/parser-sdk` contracts.
  - Initial language support for `typescript` and `javascript`, with extensible loader architecture for `python`, `java`, `csharp`, `go`, `rust`, `cpp`, and `php`.
  - Implemented `TreeSitterParser`, `TreeSitterRegistry`, `TreeSitterFactory`, `LanguageLoader`, and `ASTNodeMapper`.
  - Maps AST nodes to `FunctionInfo`, `ClassInfo`, `ImportInfo`, `ExportInfo`, `ReferenceInfo`, `NamespaceInfo`, `ParseResult`.
  - Added unit test suite in `packages/tree-sitter-engine/src/__tests__/` with full V8 coverage report.

- **Event Bus Integration Layer (Task-007):**
  - Created package `@codememory/event-bus` for decoupled publish/subscribe messaging across workspace components.
  - Defined interfaces: `IEventBus`, `IEventPublisher`, `IEventSubscriber`, `IEventHandler`, `IDeadLetterQueue`, `EventMetadata`, `EventEnvelope<T>`.
  - Built `InMemoryEventBus` implementation supporting priority execution ordering, event history buffer replay, correlation ID tracing, batch publishing, and dead-letter queue error handling.
  - Integrated producer interfaces from `@codememory/workspace-watcher`, `@codememory/git-engine`, and `@codememory/parser-sdk`.
  - Added unit test suite in `packages/event-bus/src/__tests__/` with full V8 coverage report.

- **Language Parser SDK Contracts & Registry (Task-006):**
  - Created package `@codememory/parser-sdk` establishing language parsing contracts.
  - Defined `LanguageId` supporting TypeScript, JavaScript, Python, Java, C#, Go, Rust, C++, PHP, and custom extensions.
  - Defined `ParserCapabilities` contract matrix for feature resolution.
  - Created AST symbol interfaces (`SymbolInfo`, `ReferenceInfo`, `ImportInfo`, `ExportInfo`, `FunctionInfo`, `ClassInfo`, `InterfaceInfo`, `EnumInfo`, `NamespaceInfo`, `ParseResult`).
  - Defined Port interface `ILanguageParser`.
  - Built `ParserRegistry` and `ParserFactory`.
  - Added unit test suite in `packages/parser-sdk/src/__tests__/` with full V8 coverage report.

- **Workspace Watcher Observation Layer (Task-005):**
  - Created package `@codememory/workspace-watcher` for non-polling VS Code workspace event observation.
  - Defined types: `WorkspaceEvent`, `WorkspaceEventType`, `WorkspaceSession`, `WorkspaceSnapshot`, `WorkspaceEventListener`.
  - Built `VSCodeWorkspaceWatcher` service connecting to native `vscode.workspace` and `vscode.window` event subscriptions.
  - Detects 10 workspace events: `WORKSPACE_OPEN`, `WORKSPACE_CLOSE`, `FILE_CREATED`, `FILE_DELETED`, `FILE_MODIFIED`, `FILE_RENAMED`, `ACTIVE_EDITOR_CHANGED`, `ACTIVE_FILE_CHANGED`, `WORKSPACE_FOLDER_ADDED`, `WORKSPACE_FOLDER_REMOVED`.
  - Added unit test suite in `packages/workspace-watcher/src/__tests__/` with full V8 coverage report.

- **Git Engine Read-Only Foundation (Task-004):**
  - Created package `@codememory/git-engine` for read-only Git metadata retrieval.
  - Defined Hexagonal Port `IGitProvider` and implemented `SimpleGitAdapter` via `simple-git`.
  - Defined domain value objects: `GitBranch`, `GitCommit`, `GitFileChange`, `GitHistory`, `GitRepository`.
  - Built `GitService` providing read-only queries for repository detection, root path, active branch, HEAD commit, recent commit log, working tree changed files, and file commit history.
  - Added unit test suite in `packages/git-engine/src/__tests__/` with full V8 coverage report.

- **Storybook 8 Design System Catalog (Task-003.1):**
  - Integrated Storybook 8 with React + Vite in `packages/ui`.
  - Created story files for all 14 UI components (`Button`, `Card`, `Badge`, `Progress`, `Modal`, `Toast`, `Tooltip`, `ContextMenu`, `Sidebar`, `Header`, `SearchBox`, `Loading`, `Skeleton`, `EmptyState`).
  - Added `@storybook/addon-a11y` accessibility validation and `@storybook/addon-essentials` interactive controls & auto-documentation.
  - Created `DesignTokens.mdx` documenting theme variables for VS Code Dark, Light, and High Contrast environments.
  - Added `npm run storybook` and `npm run build-storybook` scripts.

- **Premium React Webview Dashboard (Task-003):**
  - Ultra-premium developer tool webview application in `apps/webview` (Raycast / Linear aesthetic).
  - Left Navigation Rail with 6 tabs (`Dashboard`, `Timeline`, `Story`, `Graph`, `Activity`, `Settings`).
  - Raycast-style Command Palette modal overlay (`CommandPaletteModal.tsx`) with hotkey shortcut support (`Cmd+K` / `Ctrl+K`).
  - Framer Motion animated grid dashboard featuring `MemoryHealthCard`, `RepositoryCard`, `QuickActionsCard`, `ActivityFeedCard`, `KnowledgeGraphPreviewCard`, `RecentChangesCard`, and `RiskPreviewCard`.
  - Added reusable UI components to `@codememory/ui`: `Progress`, `Skeleton`, `Tooltip`, and `ContextMenu`.
  - Integrated VS Code CSS Variable themes (`.vscode-dark`, `.vscode-light`, `.vscode-high-contrast`).
  - Expanded unit test coverage in `packages/ui` and `apps/webview`.

- **VS Code Extension Host (Task-002):**
  - Production-ready extension host activation & deactivation lifecycles in `apps/vscode/src/extension.ts`.
  - Registered 4 extension commands: `codememory.openDashboard`, `codememory.recordDecision`, `codememory.showStory`, and `codememory.showStatus`.
  - Built `CommandDispatcher` and `CommandRegistry` for error-isolated command handling.
  - Implemented `ConfigurationLoader` for watching `codememory.enableTelemetry` and `codememory.contextRadius`.
  - Built `SidebarWebviewProvider` rendering plain HTML displaying strictly "CodeMemory X" and "Repository Initialized".
  - Implemented `MessageBridge` for extension-to-webview IPC communication.
  - Expanded unit test coverage in `apps/vscode` to verify lifecycle, commands, configuration, and sidebar provider.

- **Monorepo Architecture (Task-001):**
  - Configured Turborepo 2.x and npm workspaces (`apps/*`, `packages/*`, `configs/*`).
  - Created shared configuration packages `@codememory/tsconfig`, `@codememory/eslint-config`, and `@codememory/prettier-config`.
  - Created foundation packages `@codememory/shared`, `@codememory/core`, `@codememory/events`, `@codememory/logging`, and `@codememory/ui`.
  - Scaffolded `apps/vscode` extension manifest, command registration, and webview provider shell.
  - Scaffolded `apps/webview` React + Vite + TailwindCSS dashboard frame with dark/light/high-contrast theme CSS variables.
  - Configured Vitest test harness across packages and applications.
  - Configured GitHub Actions CI workflow for build and lint validation.
