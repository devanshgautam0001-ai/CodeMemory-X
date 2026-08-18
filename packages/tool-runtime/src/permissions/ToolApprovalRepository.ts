/**
 * ToolApprovalRepository
 *
 * Persists tool approval lifecycle events (REQUESTED, RESPONDED) to the
 * existing EventStore (SQLite via @codememory/event-store).
 *
 * Persisted fields:
 *   approvalId, requestId, conversationId, toolCallId, toolName,
 *   arguments (sanitised), status, timestamps
 *
 * NEVER persisted: API keys, auth headers, secrets, live callbacks,
 *   AbortControllers, promise references.
 *
 * Event types used:
 *   TOOL_APPROVAL_REQUESTED  -- approval created and waiting for user input
 *   TOOL_APPROVAL_RESPONDED  -- user approved/denied/cancelled
 *   TOOL_APPROVAL_EXPIRED    -- TTL elapsed before user responded
 */
import { EventStore } from '@codememory/event-store';
import { ILogger } from '@codememory/logging';
import { ToolApprovalRequest, ToolApprovalState } from '../types/ToolApproval.js';

export interface PersistedApprovalEvent {
  approvalId: string;
  requestId: string;
  conversationId?: string;
  toolCallId: string;
  toolName: string;
  /** Sanitised argument snapshot -- no secrets, no credentials */
  arguments: Record<string, unknown>;
  status: ToolApprovalState;
  requestedAt: string;
  expiresAt: string;
  respondedAt?: string;
}

type ToolApprovalEventType =
  | `TOOL_APPROVAL_REQUESTED`
  | `TOOL_APPROVAL_RESPONDED`
  | `TOOL_APPROVAL_EXPIRED`;

export class ToolApprovalRepository {
  constructor(
    private readonly eventStore: EventStore,
    private readonly workspace: string = `global`,
    private readonly logger?: ILogger
  ) {}

  public async persistRequested(req: ToolApprovalRequest): Promise<void> {
    await this.appendEvent(`TOOL_APPROVAL_REQUESTED`, req.approvalId, req.requestId, {
      approvalId: req.approvalId,
      requestId: req.requestId,
      conversationId: req.conversationId,
      toolCallId: req.toolCallId,
      toolName: req.toolName,
      arguments: this.sanitiseArguments(req.arguments),
      status: `PENDING`,
      requestedAt: req.requestedAt,
      expiresAt: req.expiresAt,
    });
  }

  public async persistResponded(req: ToolApprovalRequest): Promise<void> {
    const eventType: ToolApprovalEventType =
      req.state === `EXPIRED` ? `TOOL_APPROVAL_EXPIRED` : `TOOL_APPROVAL_RESPONDED`;

    await this.appendEvent(eventType, req.approvalId, req.requestId, {
      approvalId: req.approvalId,
      requestId: req.requestId,
      conversationId: req.conversationId,
      toolCallId: req.toolCallId,
      toolName: req.toolName,
      arguments: this.sanitiseArguments(req.arguments),
      status: req.state,
      requestedAt: req.requestedAt,
      expiresAt: req.expiresAt,
      respondedAt: req.respondedAt ?? new Date().toISOString(),
    });
  }

  public async getPendingApprovals(): Promise<PersistedApprovalEvent[]> {
    try {
      const queryRes = await this.eventStore.getEvents({
        workspace: this.workspace,
        eventType: `TOOL_APPROVAL_REQUESTED`,
        limit: 500,
      });

      if (queryRes.isFailure) {
        this.logger?.warn(`[ToolApprovalRepository] Failed to query TOOL_APPROVAL_REQUESTED events`);
        return [];
      }

      const requestedApprovals = (queryRes.value as Array<{ payload: PersistedApprovalEvent }>).map(
        (r) => r.payload
      );

      const responseRes = await this.eventStore.getEvents({
        workspace: this.workspace,
        eventType: `TOOL_APPROVAL_RESPONDED`,
        limit: 500,
      });
      const expiredRes = await this.eventStore.getEvents({
        workspace: this.workspace,
        eventType: `TOOL_APPROVAL_EXPIRED`,
        limit: 500,
      });

      const respondedIds = new Set<string>();
      if (responseRes.isSuccess) {
        for (const evt of responseRes.value as Array<{ payload: PersistedApprovalEvent }>) {
          respondedIds.add(evt.payload.approvalId);
        }
      }
      if (expiredRes.isSuccess) {
        for (const evt of expiredRes.value as Array<{ payload: PersistedApprovalEvent }>) {
          respondedIds.add(evt.payload.approvalId);
        }
      }

      const now = Date.now();
      return requestedApprovals.filter((appr) => {
        if (respondedIds.has(appr.approvalId)) return false;
        const expTime = new Date(appr.expiresAt).getTime();
        if (isNaN(expTime) || expTime <= now) return false;
        return true;
      });
    } catch (err) {
      this.logger?.warn(`[ToolApprovalRepository] Unexpected error recovering pending approvals`);
      return [];
    }
  }

  private async appendEvent(
    eventType: ToolApprovalEventType,
    approvalId: string,
    correlationId: string,
    payload: PersistedApprovalEvent
  ): Promise<void> {
    try {
      const res = await this.eventStore.appendEvent({
        id: `tevt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType,
        timestamp: new Date().toISOString(),
        correlationId,
        source: `tool-runtime`,
        workspace: this.workspace,
        payload,
        metadata: { approvalId },
      });
      if (res.isFailure) {
        this.logger?.warn(`[ToolApprovalRepository] Failed to persist ${eventType}`);
      }
    } catch (err) {
      this.logger?.warn(`[ToolApprovalRepository] Exception persisting ${eventType}`);
    }
  }

  private sanitiseArguments(args: unknown): Record<string, unknown> {
    if (!args || typeof args !== `object` || Array.isArray(args)) return {};
    const BLOCKED = /key|secret|token|password|credential|auth|bearer|api_key/i;
    const sanitised: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(args as Record<string, unknown>)) {
      if (BLOCKED.test(k)) continue;
      if (typeof v === `string` && v.length > 2000) {
        sanitised[k] = v.substring(0, 2000) + `...[truncated]`;
      } else {
        sanitised[k] = v;
      }
    }
    return sanitised;
  }
}
