export interface ToolExecutionContext {
  requestId: string;
  conversationId?: string;
  executionId: string;
  toolCallId: string;
  workspaceId?: string;
  sessionId?: string;
  signal?: AbortSignal;
  approvalManager?: any;
  /** Optional repository for persisting approval lifecycle events */
  approvalRepo?: any;
  /** Optional auditor for recording full execution lifecycle */
  auditor?: any;
  onApprovalRequest?: (req: any) => void;
  metadata?: Record<string, unknown>;
}
