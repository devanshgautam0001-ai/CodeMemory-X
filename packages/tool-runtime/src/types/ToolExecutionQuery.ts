import { ToolExecutionAudit, ToolExecutionAuditStatus } from './ToolExecutionAudit.js';
import { ToolAnalyticsFilter } from './ToolAnalyticsFilter.js';

export interface ToolExecutionQuery extends ToolAnalyticsFilter {
  limit?: number;
  offset?: number;
}

export interface ToolExecutionQueryResult {
  items: ToolExecutionAudit[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}
