export type WebviewCommandType =
  | 'REQUEST_SNAPSHOT'
  | 'RECORD_DECISION'
  | 'SEARCH_MEMORIES'
  | 'GET_STORY'
  | 'GET_IMPACT'
  | 'GET_DRIFT'
  | 'GET_SESSION'
  | 'SWITCH_TAB'
  | 'ASK_ASSISTANT'
  | 'STREAM_ASSISTANT'
  | 'CANCEL_ASSISTANT'
  | 'GET_ASSISTANT_CONTEXT'
  | 'GET_ASSISTANT_CONVERSATION'
  | 'CLEAR_ASSISTANT_CONVERSATION'
  | 'LIST_ASSISTANT_CONVERSATIONS'
  | 'CREATE_ASSISTANT_CONVERSATION'
  | 'SWITCH_ASSISTANT_CONVERSATION'
  | 'DELETE_ASSISTANT_CONVERSATION'
  | 'RESPOND_TOOL_APPROVAL'
  | 'LIST_PENDING_APPROVALS'
  | 'GET_TOOL_AUDIT_TIMELINE'
  | 'GET_TOOL_AUDIT_ENTRY'
  | 'QUERY_TOOL_EXECUTIONS'
  | 'GET_TOOL_ANALYTICS'
  | 'GET_TOOL_VISUALIZATION'
  | 'EXPORT_TOOL_EXECUTIONS_JSON'
  | 'EXPORT_TOOL_EXECUTIONS_CSV'
  | 'EXPORT_TOOL_EXECUTIONS_REPORT'
  | 'GET_SYSTEM_HEALTH'
  | 'REFRESH_SYSTEM_HEALTH';

export interface RespondToolApprovalPayload {
  approvalId: string;
  response: 'APPROVED' | 'DENIED';
}

export interface GetToolAuditTimelinePayload {
  conversationId: string;
  limit?: number;
}

export interface GetToolAuditEntryPayload {
  executionId: string;
}

export interface QueryToolExecutionsPayload {
  conversationId?: string;
  toolName?: string;
  status?: string;
  errorCode?: string;
  approvalState?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
  limit?: number;
  offset?: number;
}

export interface GetToolAnalyticsPayload {
  conversationId?: string;
  toolName?: string;
  status?: string;
  errorCode?: string;
  approvalState?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export interface GetToolVisualizationPayload extends GetToolAnalyticsPayload {
  numBuckets?: number;
}

/**
 * Payload for EXPORT_TOOL_EXECUTIONS_JSON and EXPORT_TOOL_EXECUTIONS_CSV.
 * Ignores pagination (full result set is always returned for export).
 * Status filter is intentionally optional — omit to export all statuses.
 */
export interface ExportToolExecutionsPayload {
  conversationId?: string;
  toolName?: string;
  status?: string;
  errorCode?: string;
  approvalState?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export interface CreateAssistantConversationPayload {
  title?: string;
}

export interface SwitchAssistantConversationPayload {
  conversationId: string;
}

export interface DeleteAssistantConversationPayload {
  conversationId: string;
}

export interface GetAssistantConversationPayload {
  conversationId: string;
}

export interface AssistantStreamChunkPayload {
  requestId: string;
  conversationId: string;
  contentDelta?: string;
  fullContent?: string;
  isComplete: boolean;
  contextUsed?: any;
  toolCallsExecuted?: any[];
  error?: string;
}

export interface AskAssistantPayload {
  requestId?: string;
  conversationId?: string;
  prompt: string;
  activeFilePath?: string;
  activeSymbolName?: string;
  options?: {
    provider?: string;
    model?: string;
    enableTools?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface CancelAssistantPayload {
  requestId: string;
  conversationId?: string;
}

export interface GetAssistantContextPayload {
  prompt: string;
  activeFilePath?: string;
  activeSymbolName?: string;
}

export interface ClearAssistantConversationPayload {
  conversationId: string;
}

export interface RequestSnapshotPayload {
  activePath?: string;
}

export interface RecordDecisionPayload {
  title: string;
  rationale: string;
  affectedFiles?: string[];
  boundSymbols?: string[];
}

export interface SearchMemoriesPayload {
  query: string;
  memoryType?: string;
}

export interface GetStoryPayload {
  symbolId: string;
  name?: string;
  filePath?: string;
}

export interface GetImpactPayload {
  filePath: string;
}

export interface GetDriftPayload {
  filePath?: string;
}

export interface GetSessionPayload {
  sessionId?: string;
}

export interface SwitchTabPayload {
  tab: string;
}

export interface WebviewRpcRequest<TPayload = any> {
  requestId: string;
  command: WebviewCommandType;
  payload?: TPayload;
}

export interface WebviewRpcResponse<TResult = any> {
  requestId: string;
  command: WebviewCommandType;
  success: boolean;
  result?: TResult;
  error?: {
    code: string;
    message: string;
  };
}

export interface WebviewStateEvent<TData = any> {
  command: 'UPDATE_STATE';
  payload: TData;
}
