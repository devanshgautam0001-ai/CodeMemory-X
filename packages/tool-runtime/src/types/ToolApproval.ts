export type ToolApprovalState =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'APPROVED'
  | 'DENIED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface ToolApprovalRequest {
  approvalId: string;
  requestId: string;
  conversationId?: string;
  toolCallId: string;
  toolName: string;
  arguments: any;
  state: ToolApprovalState;
  requestedAt: string;
  expiresAt: string;
  respondedAt?: string;
}
