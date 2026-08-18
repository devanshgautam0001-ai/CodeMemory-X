/**
 * ToolExecutionAudit
 *
 * Canonical deterministic audit model for a single tool execution lifecycle.
 * One record per executionId, updated in-place through all status transitions.
 *
 * Status transitions (forward-only):
 *
 *   REQUESTED
 *     -> WAITING_APPROVAL  (tool requires human confirmation)
 *       -> APPROVED        (user approved)
 *       -> DENIED          (user denied)
 *       -> EXPIRED         (TTL elapsed)
 *       -> CANCELLED       (conversation cancelled before response)
 *     -> STARTED           (execution began — either approved or NOT_REQUIRED)
 *       -> COMPLETED       (success)
 *       -> FAILED          (error)
 *
 * NEVER stored in audit records: API keys, auth headers, secrets,
 * tool arguments, raw credentials.
 */

export type ToolExecutionAuditStatus =
  | 'REQUESTED'
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'DENIED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'STARTED'
  | 'COMPLETED'
  | 'FAILED';

export interface ToolExecutionAudit {
  /** Unique execution identifier — stable across all status transitions */
  executionId: string;

  /** The assistant/RPC request that triggered this execution */
  requestId: string;

  /** The conversation this execution belongs to */
  conversationId: string;

  /** The AI provider tool-call ID */
  toolCallId: string;

  /** Human-readable tool name (e.g. "search_code") */
  toolName: string;

  /** Current deterministic lifecycle status */
  status: ToolExecutionAuditStatus;

  /** Unix epoch ms — when the execution was first recorded */
  createdAt: number;

  /** Unix epoch ms — when tool handler execution began (post-approval) */
  startedAt?: number;

  /** Unix epoch ms — when execution completed or failed */
  completedAt?: number;

  /** Wall-clock duration of the handler execution only (excludes approval wait) */
  durationMs?: number;

  /** Error code if status is FAILED */
  errorCode?: string;

  /** Links to the ToolApprovalRequest.approvalId that gated this execution */
  approvalRequestId?: string;

  /**
   * Monotonic sequence number — order within a single requestId.
   * Starts at 1 for the first tool in a request, increments per tool.
   */
  sequence: number;
}
