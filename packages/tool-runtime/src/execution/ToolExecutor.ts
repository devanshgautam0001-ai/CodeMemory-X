import { ToolCall, ToolResult } from '../types/ToolRuntimeTypes.js';
import { ToolExecutionContext } from '../types/ToolExecutionContext.js';
import { ToolExecutionResult } from '../types/ToolExecutionResult.js';
import { ToolExecutionError } from '../types/ToolExecutionError.js';
import { ToolRegistry } from '../registry/ToolRegistry.js';
import { ToolExecutionValidator } from '../validation/ToolExecutionValidator.js';
import { ToolPermissionManager } from '../permissions/ToolPermissionManager.js';
import { ToolTimeoutController } from '../timeout/ToolTimeoutController.js';
import { ToolExecutionAuditor } from '../audit/ToolExecutionAuditor.js';
import { ToolRuntimeConfig } from '../types/ToolRuntimeConfig.js';
import { ILogger } from '@codememory/logging';

export class ToolExecutor {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly permissionManager: ToolPermissionManager,
    private readonly auditor: ToolExecutionAuditor,
    private readonly config: ToolRuntimeConfig = {},
    private readonly logger?: ILogger
  ) {}

  public async executeCall(
    toolCall: ToolCall,
    parentContext?: Partial<ToolExecutionContext>
  ): Promise<{ executionResult: ToolExecutionResult; normalizedResult: ToolResult }> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const toolName = toolCall?.name ?? 'unknown';

    // Prefer auditor from context (set by AIAssistantEngine); fall back to constructor-injected one
    const auditor: ToolExecutionAuditor = parentContext?.auditor ?? this.auditor;

    const context: ToolExecutionContext = {
      requestId: parentContext?.requestId ?? `req_${Date.now()}`,
      executionId,
      toolCallId: toolCall?.id ?? `tc_${Date.now()}`,
      workspaceId: parentContext?.workspaceId,
      sessionId: parentContext?.sessionId,
      conversationId: parentContext?.conversationId,
      signal: parentContext?.signal,
      approvalManager: parentContext?.approvalManager,
      approvalRepo: parentContext?.approvalRepo,
      auditor,
      onApprovalRequest: parentContext?.onApprovalRequest,
      metadata: parentContext?.metadata,
    };

    // -- Step 1: Record REQUESTED ------------------------------
    auditor.recordRequested({
      executionId,
      requestId: context.requestId,
      conversationId: context.conversationId ?? 'unknown',
      toolCallId: context.toolCallId,
      toolName,
    });

    try {
      // -- Step 2: Resolve & Validate arguments ------------------
      const args = ToolExecutionValidator.validate(toolCall, this.registry);
      const registeredTool = this.registry.resolve(toolName);

      // -- Step 3: Check Permissions -----------------------------
      const permState = this.permissionManager.canExecute(toolName, context);
      if (permState === 'DENY') {
        throw new ToolExecutionError({
          toolName,
          code: 'PERMISSION_DENIED',
          message: `Execution of tool '${toolName}' was DENIED by policy.`,
        });
      }

      if (permState === 'REQUIRE_CONFIRMATION') {
        if (context.approvalManager) {
          const req = context.approvalManager.createRequest(
            context.requestId,
            context.toolCallId,
            toolName,
            args,
            undefined, // use default TTL
            context.conversationId
          );

          // Persist approval request to EventStore (fire-and-forget)
          if (context.approvalRepo) {
            context.approvalRepo.persistRequested(req).catch(() => {
              this.logger?.warn(`[ToolExecutor] Failed to persist TOOL_APPROVAL_REQUESTED for ${toolName}`);
            });
          }

          // Audit: WAITING_APPROVAL
          auditor.recordWaitingApproval(executionId, req.approvalId);

          if (context.onApprovalRequest) {
            context.onApprovalRequest(req);
          }

          const userResponse = await context.approvalManager.waitForApproval(req.approvalId);

          if (userResponse !== 'APPROVED') {
            // Audit the denial/expiry/cancellation before throwing
            const outcome = userResponse as 'DENIED' | 'EXPIRED' | 'CANCELLED';
            auditor.recordApprovalOutcome(executionId, outcome);
            throw new ToolExecutionError({
              toolName,
              code: 'PERMISSION_DENIED',
              message: `Execution of tool '${toolName}' was ${userResponse} by user approval policy.`,
            });
          }

          // Audit: APPROVED
          auditor.recordApprovalOutcome(executionId, 'APPROVED');
        } else {
          throw new ToolExecutionError({
            toolName,
            code: 'CONFIRMATION_REQUIRED',
            message: `Execution of tool '${toolName}' requires explicit user confirmation.`,
          });
        }
      }

      // -- Step 4: Execute with Timeout & Cancellation -----------
      const defaultTimeout = this.config.defaultTimeoutMs ?? 30000;
      const maxTimeout = this.config.maxTimeoutMs ?? 120000;

      // Audit: STARTED (just before handler invocation)
      auditor.recordStarted(executionId);

      const rawResult = await ToolTimeoutController.runWithTimeout(
        async (signal) => {
          const execContext: ToolExecutionContext = { ...context, signal };
          return await registeredTool.execute(args, execContext);
        },
        toolName,
        defaultTimeout,
        maxTimeout,
        context.signal
      );

      const durationMs = Date.now() - startTime;
      const normalizedResult: ToolResult = {
        toolCallId: context.toolCallId,
        content: rawResult.content,
        isError: !rawResult.success,
      };

      const isSuccess = rawResult.success !== false;
      const errorCode = isSuccess ? undefined : (rawResult.error?.code ?? 'TOOL_ERROR');

      // Audit: COMPLETED or FAILED based on rawResult.success
      auditor.recordCompleted(executionId, durationMs, isSuccess, errorCode);

      return {
        executionResult: {
          ...rawResult,
          durationMs,
        },
        normalizedResult,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorCode = err instanceof ToolExecutionError ? err.code : 'EXECUTION_FAILED';
      const errorMessage = err.message ?? 'Unknown tool execution error';

      // Audit: FAILED (only if we haven't already recorded a denial outcome)
      const existing = auditor.getEntry(executionId);
      const isAlreadyTerminal = existing &&
        ['DENIED', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'FAILED'].includes(existing.status);
      if (!isAlreadyTerminal) {
        auditor.recordCompleted(executionId, durationMs, false, errorCode);
      }

      const executionResult: ToolExecutionResult = {
        success: false,
        content: { error: errorMessage },
        error: { code: errorCode, message: errorMessage },
        durationMs,
      };

      const normalizedResult: ToolResult = {
        toolCallId: context.toolCallId,
        content: JSON.stringify({ error: errorMessage, code: errorCode }),
        isError: true,
      };

      return { executionResult, normalizedResult };
    }
  }
}
