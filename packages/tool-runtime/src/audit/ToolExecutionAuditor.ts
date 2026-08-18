import { ToolExecutionRepository } from '../repository/ToolExecutionRepository.js';
import { ToolExecutionAudit, ToolExecutionAuditStatus } from '../types/ToolExecutionAudit.js';
import { IEventBus } from '@codememory/event-bus';
import { ILogger } from '@codememory/logging';

import { ToolExecutionQuery, ToolExecutionQueryResult } from '../types/ToolExecutionQuery.js';
import { ToolExecutionAnalytics, ToolExecutionExportRow, ToolExecutionReportJson } from '../types/ToolExecutionAnalytics.js';
import { AnalyticsChartData } from '../types/AnalyticsVisualization.js';

/** Minimal EventStore interface — avoids a hard dep on @codememory/event-store in this class. */
interface IEventStoreForAudit {
  appendEvent(event: {
    id: string;
    eventType: string;
    timestamp: string;
    correlationId: string;
    source: string;
    workspace: string;
    payload: unknown;
    metadata: Record<string, unknown>;
  }): Promise<{ isSuccess: boolean; isFailure: boolean; error?: Error }>;
  getEvents?(options?: { workspace?: string; eventType?: string; limit?: number }): Promise<{ isSuccess: boolean; isFailure: boolean; value?: Array<{ payload: any }> }>;
}

export class ToolExecutionAuditor {
  private readonly repository: ToolExecutionRepository;

  constructor(
    private readonly eventBus?: IEventBus,
    private readonly logger?: ILogger,
    private readonly eventStore?: IEventStoreForAudit,
    private readonly workspace: string = 'global',
    repository?: ToolExecutionRepository
  ) {
    this.repository = repository ?? new ToolExecutionRepository();
  }

  // -------------------------------------------------------------
  // Lifecycle methods (new, deterministic)
  // -------------------------------------------------------------

  /**
   * Called at the very start of executeCall — before any permission checks.
   * Creates the initial REQUESTED audit record.
   */
  public recordRequested(opts: {
    executionId: string;
    requestId: string;
    conversationId: string;
    toolCallId: string;
    toolName: string;
    sequence?: number;
  }): ToolExecutionAudit {
    const sequence = opts.sequence ?? this.repository.nextSequence(opts.requestId);
    const audit: ToolExecutionAudit = {
      executionId: opts.executionId,
      requestId: opts.requestId,
      conversationId: opts.conversationId,
      toolCallId: opts.toolCallId,
      toolName: opts.toolName,
      status: 'REQUESTED',
      createdAt: Date.now(),
      sequence,
    };
    this.repository.upsert(audit);
    this.logger?.info(`[ToolExecutionAuditor] ${opts.toolName} REQUESTED (exec: ${opts.executionId})`);
    this.persistAsync(audit);
    return audit;
  }



  /**
   * Called when human approval is requested.
   * Sets status to WAITING_APPROVAL.
   */
  public recordWaitingApproval(
    executionId: string,
    approvalRequestId: string
  ): ToolExecutionAudit | undefined {
    const updated = this.repository.updateStatus(executionId, 'WAITING_APPROVAL', {
      approvalRequestId,
    });
    if (updated) {
      this.logger?.info(`[ToolExecutionAuditor] ${updated.toolName} WAITING_APPROVAL (approval: ${approvalRequestId})`);
      this.persistAsync(updated);
    }
    return updated;
  }
  /**
   * Called after approval is resolved.
   * outcome must be one of: APPROVED | DENIED | EXPIRED | CANCELLED
   */
  public recordApprovalOutcome(
    executionId: string,
    outcome: Extract<ToolExecutionAuditStatus, 'APPROVED' | 'DENIED' | 'EXPIRED' | 'CANCELLED'>
  ): ToolExecutionAudit | undefined {
    const updated = this.repository.updateStatus(executionId, outcome);
    if (updated) {
      this.logger?.info(`[ToolExecutionAuditor] ${updated.toolName} approval outcome: ${outcome}`);
      this.persistAsync(updated);
    }
    return updated;
  }

  /**
   * Called just before the tool handler is invoked.
   */
  public recordStarted(executionId: string): ToolExecutionAudit | undefined {
    const updated = this.repository.updateStatus(executionId, 'STARTED', { startedAt: Date.now() });
    if (updated) {
      this.logger?.info(`[ToolExecutionAuditor] ${updated.toolName} STARTED`);
      this.persistAsync(updated);
    }
    return updated;
  }

  /**
   * Called when tool handler finishes (success or failure).
   */
  public recordCompleted(
    executionId: string,
    durationMs: number,
    success: boolean,
    errorCode?: string
  ): ToolExecutionAudit | undefined {
    const now = Date.now();
    const status: ToolExecutionAuditStatus = success ? 'COMPLETED' : 'FAILED';
    const updated = this.repository.updateStatus(executionId, status, {
      completedAt: now,
      durationMs,
      errorCode: success ? undefined : (errorCode ?? 'UNKNOWN'),
    });
    if (updated) {
      this.logger?.info(
        `[ToolExecutionAuditor] ${updated.toolName} ${status} in ${durationMs}ms${errorCode ? ` [${errorCode}]` : ''}`
      );
      this.persistAsync(updated);

      const eventType = success ? 'TOOL_EXECUTION_COMPLETED' : 'TOOL_EXECUTION_FAILED';
      this.eventBus?.publish({
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: eventType,
        source: 'tool-runtime',
        timestamp: new Date().toISOString(),
        correlationId: updated.requestId,
        metadata: { producerVersion: '0.1.0' },
        payload: {
          executionId,
          toolName: updated.toolName,
          toolCallId: updated.toolCallId,
          conversationId: updated.conversationId,
          durationMs,
          success,
          errorCode,
          sequence: updated.sequence,
        },
      });
    }
    return updated;
  }

  // -------------------------------------------------------------
  // Backward-compat shims — keep existing ToolExecutor call sites
  // working until the executor is updated to use lifecycle methods.
  // -------------------------------------------------------------

  /**
   * @deprecated Use recordRequested() + recordStarted() instead.
   */
  public recordStart(event: {
    executionId: string;
    requestId: string;
    toolCallId: string;
    toolName: string;
    startedAt: string;
    success: boolean;
    conversationId?: string;
  }): void {
    const convId = event.conversationId ?? 'unknown';
    // Create or patch the STARTED record
    const existing = this.repository.get(event.executionId);
    if (!existing) {
      const sequence = this.repository.nextSequence(event.requestId);
      const audit: ToolExecutionAudit = {
        executionId: event.executionId,
        requestId: event.requestId,
        conversationId: convId,
        toolCallId: event.toolCallId,
        toolName: event.toolName,
        status: 'STARTED',
        createdAt: new Date(event.startedAt).getTime(),
        startedAt: new Date(event.startedAt).getTime(),
        sequence,
      };
      this.repository.upsert(audit);
      this.logger?.info(`[ToolExecutionAuditor] Tool execution started: '${event.toolName}' (${event.executionId})`);
      this.persistAsync(audit);
    } else {
      this.recordStarted(event.executionId);
    }

    this.eventBus?.publish({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'TOOL_EXECUTION_STARTED',
      source: 'tool-runtime',
      timestamp: new Date().toISOString(),
      correlationId: event.requestId,
      metadata: { producerVersion: '0.1.0' },
      payload: {
        executionId: event.executionId,
        toolName: event.toolName,
        toolCallId: event.toolCallId,
      },
    });
  }

  /**
   * @deprecated Use recordCompleted() instead.
   * requestId is now derived from the stored record — no longer fabricated.
   */
  public recordCompletion(
    executionId: string,
    toolName: string,
    toolCallId: string,
    durationMs: number,
    success: boolean,
    errorCode?: string
  ): void {
    this.recordCompleted(executionId, durationMs, success, errorCode);
  }

  // -------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------

  public getRepository(): ToolExecutionRepository {
    return this.repository;
  }

  public getTimeline(conversationId: string, limit = 50): ToolExecutionAudit[] {
    const safeLimit = Math.max(0, typeof limit === 'number' && !isNaN(limit) ? Math.floor(limit) : 50);
    if (safeLimit === 0) return [];
    return this.repository.getByConversation(conversationId).slice(-safeLimit);
  }

  public getEntry(executionId: string): ToolExecutionAudit | undefined {
    return this.repository.get(executionId);
  }

  public async queryExecutions(query: ToolExecutionQuery = {}): Promise<ToolExecutionQueryResult> {
    await this.ensureHistoricalEventsLoaded();
    return this.repository.query(query);
  }

  public async getAnalytics(query?: ToolExecutionQuery): Promise<ToolExecutionAnalytics> {
    await this.ensureHistoricalEventsLoaded();
    const records = this.repository.listAll();
    return this.repository.computeAnalytics(records, query);
  }

  /**
   * Computes deterministic time-series visualization series points over buckets.
   * TASK-053: unpaginated time-series bucketing for chart rendering.
   */
  public async getVisualization(query?: ToolExecutionQuery, numBuckets?: number): Promise<AnalyticsChartData> {
    await this.ensureHistoricalEventsLoaded();
    const records = this.repository.listAll();
    return this.repository.computeVisualization(records, query, numBuckets);
  }

  /**
   * Exports all matching executions as a flat, secrets-free JSON array.
   * Respects all ToolExecutionQuery filters except limit/offset (full result set).
   * TASK-051: never exposes raw tool arguments or sensitive credentials.
   */
  public async exportExecutions(filter?: ToolExecutionQuery): Promise<ToolExecutionExportRow[]> {
    await this.ensureHistoricalEventsLoaded();
    return this.repository.exportToJson(filter);
  }

  /**
   * TASK-056: Exports structured JSON report containing schema version metadata,
   * active filter summary, deterministic analytics summary, and records array.
   */
  public async exportReportJson(filter?: ToolExecutionQuery): Promise<ToolExecutionReportJson> {
    await this.ensureHistoricalEventsLoaded();
    return this.repository.exportReportJson(filter);
  }

  /**
   * Exports all matching executions as an RFC-4180 CSV string.
   * Respects all ToolExecutionQuery filters except limit/offset (full result set).
   * TASK-051: never exposes raw tool arguments or sensitive credentials.
   */
  public async exportToCsv(filter?: ToolExecutionQuery): Promise<string> {
    await this.ensureHistoricalEventsLoaded();
    return this.repository.exportToCsv(filter);
  }

  private historicalEventsLoaded = false;

  private async ensureHistoricalEventsLoaded(): Promise<void> {
    if (this.historicalEventsLoaded || !this.eventStore?.getEvents) return;
    try {
      const res = await this.eventStore.getEvents({
        workspace: this.workspace,
        eventType: 'TOOL_EXECUTION_AUDIT',
        limit: 1000,
      });
      if (res.isSuccess && Array.isArray(res.value)) {
        for (const evt of res.value) {
          const payload = evt.payload as ToolExecutionAudit;
          if (payload && payload.executionId) {
            const existing = this.repository.get(payload.executionId);
            if (!existing) {
              this.repository.upsert(payload);
            }
          }
        }
      }
    } catch (err) {
      this.logger?.warn(`[ToolExecutionAuditor] Failed to load historical audit events from EventStore:`, { error: (err as Error).message });
    }
    this.historicalEventsLoaded = true;
  }

  // -------------------------------------------------------------
  // EventStore persistence (fire-and-forget — non-blocking)
  // -------------------------------------------------------------

  private persistAsync(audit: ToolExecutionAudit): void {
    if (!this.eventStore) return;
    const safeAudit = {
      executionId: audit.executionId,
      requestId: audit.requestId,
      conversationId: audit.conversationId,
      toolCallId: audit.toolCallId,
      toolName: audit.toolName,
      status: audit.status,
      createdAt: audit.createdAt,
      startedAt: audit.startedAt,
      completedAt: audit.completedAt,
      durationMs: audit.durationMs,
      errorCode: audit.errorCode,
      approvalRequestId: audit.approvalRequestId,
      sequence: audit.sequence,
      // NOTE: tool arguments are deliberately NEVER stored here
    };
    this.eventStore
      .appendEvent({
        id: `aevt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: 'TOOL_EXECUTION_AUDIT',
        timestamp: new Date().toISOString(),
        correlationId: audit.requestId,
        source: 'tool-runtime',
        workspace: this.workspace,
        payload: safeAudit,
        metadata: { executionId: audit.executionId, status: audit.status },
      })
      .catch((err: Error) => {
        this.logger?.warn(`[ToolExecutionAuditor] Failed to persist audit event for ${audit.toolName}:`, {
          error: err.message,
        });
      });
  }
}
