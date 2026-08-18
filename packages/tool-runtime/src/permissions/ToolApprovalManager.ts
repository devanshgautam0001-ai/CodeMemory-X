import { ToolApprovalRequest, ToolApprovalState } from '../types/ToolApproval.js';
import { ILogger } from '@codememory/logging';

export interface PersistedApprovalRecord {
  requestId: string;
  conversationId?: string;
  toolCallId: string;
  toolName: string;
  status: ToolApprovalState;
  createdAt: number;
  expiresAt: number;
  respondedAt?: number;
}

export class ToolApprovalManager {
  private approvals = new Map<string, ToolApprovalRequest>();
  private resolvers = new Map<string, (state: ToolApprovalState) => void>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly logger?: ILogger) { }

  public createRequest(
    requestId: string,
    toolCallId: string,
    toolName: string,
    args: any,
    ttlMs = 60000,
    conversationId?: string
  ): ToolApprovalRequest {
    const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const req: ToolApprovalRequest = {
      approvalId,
      requestId,
      conversationId,
      toolCallId,
      toolName,
      arguments: args,
      state: 'PENDING',
      requestedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    };

    this.approvals.set(approvalId, req);
    if (this.approvals.size > 5000) {
      for (const [id, item] of this.approvals.entries()) {
        if (item.state !== 'PENDING') {
          this.approvals.delete(id);
          break;
        }
      }
    }
    this.logger?.info(`[ToolApprovalManager] Created approval request ${approvalId} for tool '${toolName}'`);
    return req;
  }

  public waitForApproval(approvalId: string, timeoutMs = 60000): Promise<ToolApprovalState> {
    return new Promise((resolve) => {
      const req = this.approvals.get(approvalId);
      if (!req || req.state !== 'PENDING') {
        resolve(req?.state ?? 'EXPIRED');
        return;
      }

      const timer = setTimeout(() => {
        const item = this.approvals.get(approvalId);
        if (item?.state === 'PENDING') {
          item.state = 'EXPIRED';
          item.respondedAt = new Date().toISOString();
        }
        this.resolvers.delete(approvalId);
        this.timers.delete(approvalId);
        resolve('EXPIRED');
      }, timeoutMs);

      this.timers.set(approvalId, timer);
      this.resolvers.set(approvalId, (resState: ToolApprovalState) => {
        clearTimeout(timer);
        this.timers.delete(approvalId);
        this.resolvers.delete(approvalId);
        resolve(resState);
      });
    });
  }

  public respondApproval(approvalId: string, response: 'APPROVED' | 'DENIED'): ToolApprovalRequest | undefined {
    const req = this.approvals.get(approvalId);

    // Guard: reject stale, duplicate, or already-resolved responses
    if (!req || req.state !== 'PENDING') {
      this.logger?.warn(`[ToolApprovalManager] Stale or duplicate response for approval ${approvalId} (current state: ${req?.state ?? 'NOT_FOUND'})`);
      return req;
    }

    req.state = response;
    req.respondedAt = new Date().toISOString();

    const resolver = this.resolvers.get(approvalId);
    if (resolver) {
      resolver(response);
    }

    this.logger?.info(`[ToolApprovalManager] Approval request ${approvalId} resolved with '${response}'`);
    return req;
  }

  public getPendingApprovals(): ToolApprovalRequest[] {
    return Array.from(this.approvals.values()).filter((a) => a.state === 'PENDING');
  }

  public getApprovalById(approvalId: string): ToolApprovalRequest | undefined {
    return this.approvals.get(approvalId);
  }

  public cancelConversationApprovals(conversationId: string): void {
    for (const req of this.approvals.values()) {
      if (req.conversationId === conversationId && req.state === 'PENDING') {
        req.state = 'CANCELLED';
        req.respondedAt = new Date().toISOString();
        const resolver = this.resolvers.get(req.approvalId);
        if (resolver) resolver('CANCELLED');
      }
    }
    this.logger?.info(`[ToolApprovalManager] Cancelled all pending approvals for conversation '${conversationId}'`);
  }

  public cancelAllPending(): void {
    for (const req of this.approvals.values()) {
      if (req.state === 'PENDING') {
        req.state = 'CANCELLED';
        req.respondedAt = new Date().toISOString();
        const resolver = this.resolvers.get(req.approvalId);
        if (resolver) resolver('CANCELLED');
      }
    }
    this.logger?.info('[ToolApprovalManager] Cancelled all pending tool approval requests');
  }

  public expireStaleApprovals(): number {
    const now = Date.now();
    let expiredCount = 0;
    for (const req of this.approvals.values()) {
      if (req.state === 'PENDING' && new Date(req.expiresAt).getTime() <= now) {
        req.state = 'EXPIRED';
        req.respondedAt = new Date().toISOString();
        const resolver = this.resolvers.get(req.approvalId);
        if (resolver) resolver('EXPIRED');
        expiredCount++;
      }
    }
    return expiredCount;
  }

  public toPersistedRecord(req: ToolApprovalRequest): PersistedApprovalRecord {
    return {
      requestId: req.requestId,
      conversationId: req.conversationId,
      toolCallId: req.toolCallId,
      toolName: req.toolName,
      status: req.state,
      createdAt: new Date(req.requestedAt).getTime(),
      expiresAt: new Date(req.expiresAt).getTime(),
      respondedAt: req.respondedAt ? new Date(req.respondedAt).getTime() : undefined,
    };
  }

  public getAllRecords(): PersistedApprovalRecord[] {
    return Array.from(this.approvals.values()).map((r) => this.toPersistedRecord(r));
  }

  public clearAll(): void {
    this.cancelAllPending();
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.resolvers.clear();
  }

  public dispose(): void {
    this.clearAll();
  }
}
