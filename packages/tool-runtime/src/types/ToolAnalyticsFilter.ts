import { ToolExecutionAuditStatus } from './ToolExecutionAudit.js';

/**
 * ToolAnalyticsFilter
 *
 * Filter criteria for querying tool execution audit records, computing
 * aggregated analytics, and generating local JSON/CSV exports.
 *
 * TASK-052 extended filter model:
 * - conversationId: Filter by specific conversation ID
 * - toolName: Case-insensitive tool name filter
 * - status: Filter by specific ToolExecutionAuditStatus lifecycle state
 * - fromTimestamp: Inclusive lower bound Unix epoch ms
 * - toTimestamp: Inclusive upper bound Unix epoch ms
 * - errorCode: Filter by specific error code for FAILED executions
 * - approvalState: Filter by human-in-the-loop approval state ('REQUIRED', 'APPROVED', 'DENIED', 'EXPIRED', 'WAITING', 'NONE')
 */
export interface ToolAnalyticsFilter {
  conversationId?: string;
  toolName?: string;
  status?: ToolExecutionAuditStatus;
  fromTimestamp?: number;
  toTimestamp?: number;
  errorCode?: string;
  approvalState?: string;
}
