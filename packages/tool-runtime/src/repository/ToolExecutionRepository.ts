import { ToolExecutionAudit, ToolExecutionAuditStatus } from '../types/ToolExecutionAudit.js';
import { ToolExecutionQuery, ToolExecutionQueryResult } from '../types/ToolExecutionQuery.js';
import { ToolExecutionAnalytics, ToolUsageMetrics, ToolExecutionExportRow, ToolExecutionReportJson } from '../types/ToolExecutionAnalytics.js';
import { ToolAnalyticsFilter } from '../types/ToolAnalyticsFilter.js';
import { AnalyticsChartData, AnalyticsSeriesPoint } from '../types/AnalyticsVisualization.js';
import { normalizeAnalyticsFilter } from '../utils/normalizeAnalyticsFilter.js';

/**
 * ToolExecutionRepository
 *
 * In-memory repository for ToolExecutionAudit records.
 * One record per executionId, updated in-place across lifecycle transitions.
 *
 * Persistence to EventStore is handled by ToolExecutionAuditor.
 */
export class ToolExecutionRepository {
  /** Keyed by executionId for O(1) upsert and lookup */
  private readonly records = new Map<string, ToolExecutionAudit>();

  /** Monotonic sequence counter per requestId */
  private readonly requestSequences = new Map<string, number>();

  // -------------------------------------------------------------
  // Write
  // -------------------------------------------------------------

  public upsert(audit: ToolExecutionAudit): void {
    this.records.set(audit.executionId, audit);
    if (this.records.size > 10_000) {
      const oldestKey = this.records.keys().next().value;
      if (oldestKey) this.records.delete(oldestKey);
    }
  }

  public updateStatus(
    executionId: string,
    status: ToolExecutionAuditStatus,
    patch?: Partial<Pick<ToolExecutionAudit, 'startedAt' | 'completedAt' | 'durationMs' | 'errorCode' | 'approvalRequestId'>>
  ): ToolExecutionAudit | undefined {
    const existing = this.records.get(executionId);
    if (!existing) return undefined;
    const updated: ToolExecutionAudit = { ...existing, status, ...patch };
    this.records.set(executionId, updated);
    return updated;
  }

  /**
   * Returns the next sequence number for a given requestId.
   * Starts at 1 for the first tool call in a request.
   */
  public nextSequence(requestId: string): number {
    const next = (this.requestSequences.get(requestId) ?? 0) + 1;
    this.requestSequences.set(requestId, next);
    if (this.requestSequences.size > 5_000) {
      const oldestKey = this.requestSequences.keys().next().value;
      if (oldestKey) this.requestSequences.delete(oldestKey);
    }
    return next;
  }

  // -------------------------------------------------------------
  // Read
  // -------------------------------------------------------------

  public get(executionId: string): ToolExecutionAudit | undefined {
    return this.records.get(executionId);
  }

  public getByConversation(conversationId: string): ToolExecutionAudit[] {
    return Array.from(this.records.values())
      .filter((r) => r.conversationId === conversationId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  public getByRequest(requestId: string): ToolExecutionAudit[] {
    return Array.from(this.records.values())
      .filter((r) => r.requestId === requestId)
      .sort((a, b) => a.sequence - b.sequence);
  }

  public getRecent(limit = 50): ToolExecutionAudit[] {
    return Array.from(this.records.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  public listAll(): ToolExecutionAudit[] {
    return Array.from(this.records.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  public listEvents(): ToolExecutionAudit[] {
    return this.listAll();
  }

  private applyFilter(records: ToolExecutionAudit[], rawFilter?: ToolAnalyticsFilter): ToolExecutionAudit[] {
    let filtered = records;
    const filter = normalizeAnalyticsFilter(rawFilter);

    if (filter.conversationId) {
      filtered = filtered.filter((r) => r.conversationId === filter.conversationId);
    }
    if (filter.toolName) {
      filtered = filtered.filter((r) => r.toolName.toLowerCase() === filter.toolName!.toLowerCase());
    }
    if (filter.status) {
      filtered = filtered.filter((r) => r.status === filter.status);
    }
    if (typeof filter.fromTimestamp === 'number') {
      filtered = filtered.filter((r) => r.createdAt >= filter.fromTimestamp!);
    }
    if (typeof filter.toTimestamp === 'number') {
      filtered = filtered.filter((r) => r.createdAt <= filter.toTimestamp!);
    }
    if (filter.errorCode) {
      filtered = filtered.filter((r) => r.errorCode?.toLowerCase() === filter.errorCode!.toLowerCase());
    }
    if (filter.approvalState) {
      const state = filter.approvalState.toUpperCase();
      if (state === 'REQUIRED') {
        filtered = filtered.filter((r) => Boolean(r.approvalRequestId));
      } else if (state === 'NONE' || state === 'NOT_REQUIRED') {
        filtered = filtered.filter((r) => !r.approvalRequestId);
      } else if (state === 'APPROVED') {
        filtered = filtered.filter(
          (r) =>
            r.status === 'APPROVED' ||
            (Boolean(r.approvalRequestId) &&
              (r.status === 'COMPLETED' || r.status === 'FAILED' || r.status === 'STARTED'))
        );
      } else if (state === 'DENIED') {
        filtered = filtered.filter((r) => r.status === 'DENIED');
      } else if (state === 'EXPIRED') {
        filtered = filtered.filter((r) => r.status === 'EXPIRED');
      } else if (state === 'WAITING' || state === 'WAITING_APPROVAL') {
        filtered = filtered.filter((r) => r.status === 'WAITING_APPROVAL');
      }
    }

    return filtered;
  }

  public query(query: ToolExecutionQuery = {}): ToolExecutionQueryResult {
    let filtered = this.applyFilter(Array.from(this.records.values()), query);

    filtered.sort((a, b) => b.createdAt - a.createdAt);

    const total = filtered.length;
    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.max(1, query.limit ?? 50);
    const items = filtered.slice(offset, offset + limit);

    return {
      items,
      total,
      offset,
      limit,
      hasMore: offset + items.length < total,
    };
  }

  public computeAnalytics(records: ToolExecutionAudit[], filter?: ToolExecutionQuery): ToolExecutionAnalytics {
    const filtered = this.applyFilter(records, filter);

    const totalCount = filtered.length;
    let successCount = 0;
    let failureCount = 0;
    let waitingApprovalCount = 0;
    let approvalCount = 0;
    let approvalDeniedCount = 0;
    let approvalExpiredCount = 0;
    let cancelledCount = 0;
    // deniedCount and expiredCount are execution-level status counts
    // (equal to approvalDeniedCount/approvalExpiredCount in this model)
    let deniedCount = 0;
    let expiredCount = 0;
    let totalDurationMs = 0;
    let durationCount = 0;
    let globalMinDurationMs = Number.MAX_SAFE_INTEGER;
    let globalMaxDurationMs = 0;

    const byToolMap: Record<string, ToolUsageMetrics> = {};
    const errorCountsByCode: Record<string, number> = {};

    for (const r of filtered) {
      switch (r.status) {
        case 'COMPLETED':
          successCount++;
          break;
        case 'FAILED':
          failureCount++;
          break;
        case 'WAITING_APPROVAL':
          waitingApprovalCount++;
          break;
        case 'APPROVED':
          approvalCount++;
          break;
        case 'DENIED':
          deniedCount++;
          approvalDeniedCount++;
          break;
        case 'EXPIRED':
          expiredCount++;
          approvalExpiredCount++;
          break;
        case 'CANCELLED':
          cancelledCount++;
          break;
      }

      if (typeof r.durationMs === 'number') {
        totalDurationMs += r.durationMs;
        durationCount++;
        if (r.durationMs < globalMinDurationMs) globalMinDurationMs = r.durationMs;
        if (r.durationMs > globalMaxDurationMs) globalMaxDurationMs = r.durationMs;
      }

      if (r.errorCode) {
        errorCountsByCode[r.errorCode] = (errorCountsByCode[r.errorCode] ?? 0) + 1;
      }

      const toolMetrics = byToolMap[r.toolName] ?? {
        toolName: r.toolName,
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        approvalCount: 0,
        denialCount: 0,
        avgDurationMs: 0,
        minDurationMs: Number.MAX_SAFE_INTEGER,
        maxDurationMs: 0,
      };

      toolMetrics.totalExecutions++;
      if (r.status === 'COMPLETED') toolMetrics.successCount++;
      if (r.status === 'FAILED') toolMetrics.failureCount++;
      if (r.status === 'APPROVED' || r.approvalRequestId) toolMetrics.approvalCount++;
      if (r.status === 'DENIED') toolMetrics.denialCount++;

      if (typeof r.durationMs === 'number') {
        toolMetrics.minDurationMs = Math.min(toolMetrics.minDurationMs, r.durationMs);
        toolMetrics.maxDurationMs = Math.max(toolMetrics.maxDurationMs, r.durationMs);
      }

      byToolMap[r.toolName] = toolMetrics;
    }

    // Compute per-tool averages and fix sentinel min values
    for (const tName of Object.keys(byToolMap)) {
      const tm = byToolMap[tName];
      const toolDurations = filtered.filter((r) => r.toolName === tName && typeof r.durationMs === 'number');
      if (toolDurations.length > 0) {
        const sum = toolDurations.reduce((acc, curr) => acc + (curr.durationMs ?? 0), 0);
        tm.avgDurationMs = Math.round(sum / toolDurations.length);
      } else {
        tm.avgDurationMs = 0;
        tm.minDurationMs = 0;
      }
      if (tm.minDurationMs === Number.MAX_SAFE_INTEGER) {
        tm.minDurationMs = 0;
      }
    }

    // Sort byTool array by totalExecutions descending
    const byTool: ToolUsageMetrics[] = Object.values(byToolMap).sort(
      (a, b) => b.totalExecutions - a.totalExecutions
    );

    const successRate = totalCount > 0 ? successCount / totalCount : 0;
    const avgDurationMs = durationCount > 0 ? Math.round(totalDurationMs / durationCount) : 0;
    const minDurationMs = durationCount > 0 && globalMinDurationMs !== Number.MAX_SAFE_INTEGER ? globalMinDurationMs : 0;
    const maxDurationMs = durationCount > 0 ? globalMaxDurationMs : 0;

    return {
      totalCount,
      successRate: Math.round(successRate * 10000) / 10000,
      // New canonical field names (TASK-051)
      successCount,
      failureCount,
      cancelledCount,
      deniedCount,
      expiredCount,
      waitingApprovalCount,
      approvalCount,
      approvalDeniedCount,
      approvalExpiredCount,
      totalDurationMs,
      avgDurationMs,
      minDurationMs,
      maxDurationMs,
      byTool,
      errorCountsByCode,
      timeRange: {
        fromTimestamp: filter?.fromTimestamp,
        toTimestamp: filter?.toTimestamp,
      },
      // Backward-compat aliases (TASK-049/050)
      completedCount: successCount,
      failedCount: failureCount,
      approvedCount: approvalCount,
    };
  }

  public clear(): void {
    this.records.clear();
    this.requestSequences.clear();
  }

  // -------------------------------------------------------------
  // Deterministic Visualization Bucketing (TASK-053)
  // -------------------------------------------------------------

  public computeVisualization(
    records: ToolExecutionAudit[],
    filter?: ToolAnalyticsFilter,
    numBuckets = 12
  ): AnalyticsChartData {
    const filtered = this.applyFilter(records, filter);

    let fromTimestamp = filter?.fromTimestamp;
    let toTimestamp = filter?.toTimestamp;

    if (typeof fromTimestamp !== 'number' || typeof toTimestamp !== 'number') {
      if (filtered.length > 0) {
        let minTs = Number.MAX_SAFE_INTEGER;
        let maxTs = 0;
        for (const r of filtered) {
          if (r.createdAt < minTs) minTs = r.createdAt;
          if (r.createdAt > maxTs) maxTs = r.createdAt;
        }
        fromTimestamp = typeof fromTimestamp === 'number' ? fromTimestamp : minTs;
        toTimestamp = typeof toTimestamp === 'number' ? toTimestamp : Math.max(maxTs, minTs + 1000);
      } else {
        const now = Date.now();
        fromTimestamp = typeof fromTimestamp === 'number' ? fromTimestamp : now - 3_600_000;
        toTimestamp = typeof toTimestamp === 'number' ? toTimestamp : now;
      }
    }

    // TASK-054: Max 30-day time range protection (30 * 86400 * 1000 ms)
    const MAX_RANGE_MS = 30 * 86_400_000;
    if (toTimestamp - fromTimestamp > MAX_RANGE_MS) {
      fromTimestamp = toTimestamp - MAX_RANGE_MS;
    }

    if (toTimestamp <= fromTimestamp) {
      toTimestamp = fromTimestamp + 1000;
    }

    // TASK-054: Bound number of buckets to max 500
    const safeNumBuckets = typeof numBuckets === 'number' && !isNaN(numBuckets) ? numBuckets : 12;
    const nBuckets = Math.min(500, Math.max(1, safeNumBuckets));
    const bucketSizeMs = Math.max(1000, Math.ceil((toTimestamp - fromTimestamp) / nBuckets));

    const totalPoints: AnalyticsSeriesPoint[] = [];
    const completedPoints: AnalyticsSeriesPoint[] = [];
    const failedPoints: AnalyticsSeriesPoint[] = [];
    const cancelledPoints: AnalyticsSeriesPoint[] = [];
    const deniedPoints: AnalyticsSeriesPoint[] = [];
    const expiredPoints: AnalyticsSeriesPoint[] = [];
    const avgLatencyPoints: AnalyticsSeriesPoint[] = [];
    const minLatencyPoints: AnalyticsSeriesPoint[] = [];
    const maxLatencyPoints: AnalyticsSeriesPoint[] = [];
    const successRatePoints: AnalyticsSeriesPoint[] = [];

    let overallCompleted = 0;
    let overallFailed = 0;
    let overallCancelled = 0;
    let overallDenied = 0;
    let overallExpired = 0;
    let overallDurationSum = 0;
    let overallDurationCount = 0;
    let overallMinDuration = Number.MAX_SAFE_INTEGER;
    let overallMaxDuration = 0;

    for (let i = 0; i < nBuckets; i++) {
      const bucketStart = fromTimestamp + i * bucketSizeMs;
      const bucketEnd = bucketStart + bucketSizeMs;

      let bTotal = 0;
      let bCompleted = 0;
      let bFailed = 0;
      let bCancelled = 0;
      let bDenied = 0;
      let bExpired = 0;
      let bDurationSum = 0;
      let bDurationCount = 0;
      let bMinDuration = Number.MAX_SAFE_INTEGER;
      let bMaxDuration = 0;

      for (const r of filtered) {
        if (r.createdAt >= bucketStart && (i === nBuckets - 1 ? r.createdAt <= bucketEnd : r.createdAt < bucketEnd)) {
          bTotal++;
          switch (r.status) {
            case 'COMPLETED':
              bCompleted++;
              overallCompleted++;
              break;
            case 'FAILED':
              bFailed++;
              overallFailed++;
              break;
            case 'CANCELLED':
              bCancelled++;
              overallCancelled++;
              break;
            case 'DENIED':
              bDenied++;
              overallDenied++;
              break;
            case 'EXPIRED':
              bExpired++;
              overallExpired++;
              break;
          }

          if (typeof r.durationMs === 'number') {
            bDurationSum += r.durationMs;
            bDurationCount++;
            if (r.durationMs < bMinDuration) bMinDuration = r.durationMs;
            if (r.durationMs > bMaxDuration) bMaxDuration = r.durationMs;

            overallDurationSum += r.durationMs;
            overallDurationCount++;
            if (r.durationMs < overallMinDuration) overallMinDuration = r.durationMs;
            if (r.durationMs > overallMaxDuration) overallMaxDuration = r.durationMs;
          }
        }
      }

      totalPoints.push({ timestamp: bucketStart, value: bTotal });
      completedPoints.push({ timestamp: bucketStart, value: bCompleted });
      failedPoints.push({ timestamp: bucketStart, value: bFailed });
      cancelledPoints.push({ timestamp: bucketStart, value: bCancelled });
      deniedPoints.push({ timestamp: bucketStart, value: bDenied });
      expiredPoints.push({ timestamp: bucketStart, value: bExpired });

      avgLatencyPoints.push({
        timestamp: bucketStart,
        value: bDurationCount > 0 ? Math.round(bDurationSum / bDurationCount) : 0,
      });
      minLatencyPoints.push({
        timestamp: bucketStart,
        value: bDurationCount > 0 && bMinDuration !== Number.MAX_SAFE_INTEGER ? bMinDuration : 0,
      });
      maxLatencyPoints.push({
        timestamp: bucketStart,
        value: bDurationCount > 0 ? bMaxDuration : 0,
      });

      const sRate = bTotal > 0 ? Math.round((bCompleted / bTotal) * 10000) / 10000 : 0;
      successRatePoints.push({ timestamp: bucketStart, value: sRate });
    }

    const totalExecutions = filtered.length;
    const overallSuccessRate = totalExecutions > 0 ? Math.round((overallCompleted / totalExecutions) * 10000) / 10000 : 0;
    const avgDurationMs = overallDurationCount > 0 ? Math.round(overallDurationSum / overallDurationCount) : 0;
    const minDurationMs = overallDurationCount > 0 && overallMinDuration !== Number.MAX_SAFE_INTEGER ? overallMinDuration : 0;
    const maxDurationMs = overallDurationCount > 0 ? overallMaxDuration : 0;

    return {
      fromTimestamp,
      toTimestamp,
      bucketSizeMs,
      totalExecutions,
      successRate: overallSuccessRate,
      avgDurationMs,
      minDurationMs,
      maxDurationMs,
      completedCount: overallCompleted,
      failedCount: overallFailed,
      cancelledCount: overallCancelled,
      deniedCount: overallDenied,
      expiredCount: overallExpired,
      series: [
        { id: 'total', label: 'Total Executions', points: totalPoints },
        { id: 'completed', label: 'Completed Executions', points: completedPoints },
        { id: 'failed', label: 'Failed Executions', points: failedPoints },
        { id: 'cancelled', label: 'Cancelled Executions', points: cancelledPoints },
        { id: 'denied', label: 'Denied Approvals', points: deniedPoints },
        { id: 'expired', label: 'Expired Approvals', points: expiredPoints },
        { id: 'avgLatency', label: 'Avg Latency (ms)', points: avgLatencyPoints },
        { id: 'minLatency', label: 'Min Latency (ms)', points: minLatencyPoints },
        { id: 'maxLatency', label: 'Max Latency (ms)', points: maxLatencyPoints },
        { id: 'successRate', label: 'Success Rate', points: successRatePoints },
      ],
    };
  }

  // -------------------------------------------------------------
  // Export helpers (TASK-051)
  // -------------------------------------------------------------

  /**
   * Converts a single ToolExecutionAudit to a flat, secrets-free ToolExecutionExportRow.
   * Raw tool arguments are never included.
   */
  private toExportRow(r: ToolExecutionAudit): ToolExecutionExportRow {
    return {
      executionId: r.executionId,
      toolName: r.toolName,
      status: r.status,
      conversationId: r.conversationId,
      createdAt: new Date(r.createdAt).toISOString(),
      startedAt: r.startedAt != null ? new Date(r.startedAt).toISOString() : undefined,
      completedAt: r.completedAt != null ? new Date(r.completedAt).toISOString() : undefined,
      durationMs: r.durationMs,
      errorCode: r.errorCode,
      approvalRequestId: r.approvalRequestId,
      sequence: r.sequence,
    };
  }

  /**
   * Returns all matching records as a flat JSON-safe array.
   * TASK-056: Deterministic ordering: 1. createdAt DESC -> 2. sequence DESC -> 3. executionId ASC.
   * Ignores pagination (limit/offset) — always returns full result set for export.
   */
  public exportToJson(filter?: ToolExecutionQuery): ToolExecutionExportRow[] {
    let filtered = this.applyFilter(Array.from(this.records.values()), filter);
    filtered.sort((a, b) => {
      if (b.createdAt !== a.createdAt) return b.createdAt - a.createdAt;
      if (b.sequence !== a.sequence) return b.sequence - a.sequence;
      return a.executionId.localeCompare(b.executionId);
    });
    return filtered.map((r) => this.toExportRow(r));
  }

  /**
   * TASK-056: Returns a structured JSON report containing schema version metadata,
   * active filter summary, deterministic analytics summary, and records array.
   */
  public exportReportJson(filter?: ToolExecutionQuery): ToolExecutionReportJson {
    const records = this.exportToJson(filter);
    const analytics = this.computeAnalytics(Array.from(this.records.values()), filter);

    return {
      metadata: {
        schemaVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        totalExportedRecords: records.length,
        filterSummary: filter ?? {},
        analyticsSummary: {
          totalExecutions: analytics.totalCount,
          successRate: analytics.successRate,
          completedCount: analytics.successCount,
          failedCount: analytics.failureCount,
          cancelledCount: analytics.cancelledCount,
          deniedCount: analytics.deniedCount,
          expiredCount: analytics.expiredCount,
          avgDurationMs: analytics.avgDurationMs,
          minDurationMs: analytics.minDurationMs,
          maxDurationMs: analytics.maxDurationMs,
        },
      },
      records,
    };
  }

  /** RFC-4180 CSV export — no secrets, no tool arguments, formula injection protected. */
  public exportToCsv(filter?: ToolExecutionQuery): string {
    const rows = this.exportToJson(filter);
    const HEADERS: (keyof ToolExecutionExportRow)[] = [
      'executionId',
      'toolName',
      'status',
      'conversationId',
      'createdAt',
      'startedAt',
      'completedAt',
      'durationMs',
      'errorCode',
      'approvalRequestId',
      'sequence',
    ];

    const escapeCell = (value: unknown): string => {
      if (value == null) return '';
      let s = String(value);
      // TASK-056 & TASK-059: Formula & control injection protection (=, +, -, @, \t, \r)
      if (/^[=+\-@\t\r]/.test(s)) {
        s = "'" + s;
      }
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const lines: string[] = [
      HEADERS.join(','),
      ...rows.map((row) => HEADERS.map((h) => escapeCell(row[h])).join(',')),
    ];
    return lines.join('\n');
  }
}

// -------------------------------------------------------------
// Legacy type alias — kept for backward compat with any code
// that still imports ToolAuditEvent. New code should use
// ToolExecutionAudit directly.
// -------------------------------------------------------------
export type ToolAuditEvent = ToolExecutionAudit;
