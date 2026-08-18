/**
 * ToolUsageMetrics
 * Per-tool aggregated execution statistics within a ToolExecutionAnalytics snapshot.
 */
export interface ToolUsageMetrics {
  toolName: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  /** Total executions that required human approval */
  approvalCount: number;
  /** Executions whose approval was denied */
  denialCount: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
}

/**
 * ToolExecutionAnalytics
 *
 * Aggregated, deterministic metrics over a set of ToolExecutionAudit records.
 * All fields are computed from EventStore-backed data — no ML, embeddings, or
 * probabilistic values are used.
 *
 * TASK-051 extended model:
 * - Added totalDurationMs, minDurationMs, maxDurationMs
 * - Renamed: completedCount → successCount, failedCount → failureCount
 * - Renamed: approvedCount → approvalCount
 * - Added split approval counts: approvalDeniedCount, approvalExpiredCount
 * - Changed byTool from Record<string, ToolUsageMetrics> → ToolUsageMetrics[]
 *   (sorted by totalExecutions descending)
 * - Backward-compat aliases retained for TASK-049/050 consumers
 */
export interface ToolExecutionAnalytics {
  /** Total records in the result set */
  totalCount: number;

  /** Fraction of total that reached COMPLETED (0.0 – 1.0, 4-decimal precision) */
  successRate: number;

  // ── Execution status counts ──────────────────────────────────────────────
  /** Executions that reached COMPLETED status */
  successCount: number;
  /** Executions that reached FAILED status */
  failureCount: number;
  /** Executions that were CANCELLED */
  cancelledCount: number;
  /** Executions whose approval was DENIED */
  deniedCount: number;
  /** Executions whose approval request EXPIRED */
  expiredCount: number;
  /** Executions currently WAITING_APPROVAL */
  waitingApprovalCount: number;

  // ── Approval-specific counts ─────────────────────────────────────────────
  /** Executions that were APPROVED by the human-in-the-loop */
  approvalCount: number;
  /** Approval requests explicitly denied by the user */
  approvalDeniedCount: number;
  /** Approval requests that timed out without a response */
  approvalExpiredCount: number;

  // ── Latency stats (handler wall-clock only, excludes approval wait) ───────
  /** Sum of all durationMs values across all timed executions */
  totalDurationMs: number;
  /** Mean durationMs across executions that have a durationMs value */
  avgDurationMs: number;
  /** Minimum durationMs observed (0 if no timed executions) */
  minDurationMs: number;
  /** Maximum durationMs observed (0 if no timed executions) */
  maxDurationMs: number;

  // ── Breakdown ────────────────────────────────────────────────────────────
  /** Per-tool metrics array, sorted by totalExecutions descending */
  byTool: ToolUsageMetrics[];
  /** Error code distribution across FAILED executions */
  errorCountsByCode: Record<string, number>;

  /** Time range this analytics snapshot covers */
  timeRange: {
    fromTimestamp?: number;
    toTimestamp?: number;
  };

  // ── Backward-compat aliases (preserved for TASK-049/050 consumers) ───────
  /** @deprecated Use successCount */
  completedCount: number;
  /** @deprecated Use failureCount */
  failedCount: number;
  /** @deprecated Use approvalCount */
  approvedCount: number;
}

/**
 * ToolExecutionExportRow
 *
 * Flat, secrets-free DTO used for CSV/JSON local export.
 * Never includes raw tool arguments, API keys, access tokens, or user credentials.
 * Mirrors exactly the fields stored in ToolExecutionAudit minus any sensitive content.
 */
export interface ToolExecutionExportRow {
  executionId: string;
  toolName: string;
  status: string;
  conversationId: string;
  /** ISO-8601 timestamp string */
  createdAt: string;
  /** ISO-8601 timestamp string — undefined if execution never started */
  startedAt?: string;
  /** ISO-8601 timestamp string — undefined if execution never finished */
  completedAt?: string;
  /** Handler wall-clock duration in ms (excludes approval wait time) */
  durationMs?: number;
  /** Error code if status is FAILED */
  errorCode?: string;
  /** Approval request ID, present if this execution required human approval */
  approvalRequestId?: string;
  /** Monotonic position of this tool call within its parent requestId */
  sequence: number;
}

/**
 * ToolExecutionReportMetadata
 *
 * Deterministic report header containing schema version, timestamp, active filter summary,
 * total exported records count, and aggregated analytics metrics.
 * Strictly metadata-only — zero prompts, tool arguments, or credentials.
 */
export interface ToolExecutionReportMetadata {
  schemaVersion: '1.0.0';
  generatedAt: string;
  totalExportedRecords: number;
  filterSummary: {
    conversationId?: string;
    toolName?: string;
    status?: string;
    fromTimestamp?: number;
    toTimestamp?: number;
    errorCode?: string;
    approvalState?: string;
  };
  analyticsSummary: {
    totalExecutions: number;
    successRate: number;
    completedCount: number;
    failedCount: number;
    cancelledCount: number;
    deniedCount: number;
    expiredCount: number;
    avgDurationMs: number;
    minDurationMs: number;
    maxDurationMs: number;
  };
}

/**
 * ToolExecutionReportJson
 *
 * Structured JSON export format containing deterministic report metadata and flat export rows.
 */
export interface ToolExecutionReportJson {
  metadata: ToolExecutionReportMetadata;
  records: ToolExecutionExportRow[];
}


