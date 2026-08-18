import { ILogger } from '@codememory/logging';
import {
  WebviewCommandType,
  WebviewRpcRequest,
  WebviewRpcResponse,
} from '@codememory/shared';
import { normalizeAnalyticsFilter } from '@codememory/tool-runtime';
import { VerticalSlicePipeline } from '../pipeline/VerticalSlicePipeline.js';

export class MessageBridge {
  private readonly validCommands: Set<string> = new Set([
    'REQUEST_SNAPSHOT',
    'RECORD_DECISION',
    'SEARCH_MEMORIES',
    'GET_STORY',
    'GET_IMPACT',
    'GET_DRIFT',
    'GET_SESSION',
    'SWITCH_TAB',
    'ASK_ASSISTANT',
    'STREAM_ASSISTANT',
    'CANCEL_ASSISTANT',
    'GET_ASSISTANT_CONTEXT',
    'GET_ASSISTANT_CONVERSATION',
    'CLEAR_ASSISTANT_CONVERSATION',
    'LIST_ASSISTANT_CONVERSATIONS',
    'CREATE_ASSISTANT_CONVERSATION',
    'SWITCH_ASSISTANT_CONVERSATION',
    'DELETE_ASSISTANT_CONVERSATION',
    'RESPOND_TOOL_APPROVAL',
    'LIST_PENDING_APPROVALS',
    'GET_TOOL_AUDIT_TIMELINE',
    'GET_TOOL_AUDIT_ENTRY',
    'QUERY_TOOL_EXECUTIONS',
    'GET_TOOL_ANALYTICS',
    'GET_TOOL_VISUALIZATION',
    'EXPORT_TOOL_EXECUTIONS_JSON',
    'EXPORT_TOOL_EXECUTIONS_CSV',
    'EXPORT_TOOL_EXECUTIONS_REPORT',
    'GET_SYSTEM_HEALTH',
    'REFRESH_SYSTEM_HEALTH',
  ]);

  private readonly pipeline?: VerticalSlicePipeline;
  private readonly logger?: ILogger;

  // TASK-058: RPC Bridge operational health metrics
  private rpcMetrics = {
    requestsReceived: 0,
    successfulResponses: 0,
    failedResponses: 0,
    activeRequests: 0,
    lastRequestTimestamp: undefined as string | undefined,
  };

  constructor(
    pipelineOrLogger?: VerticalSlicePipeline | ILogger,
    logger?: ILogger
  ) {
    if (pipelineOrLogger && typeof (pipelineOrLogger as any).getLiveSnapshot === 'function') {
      this.pipeline = pipelineOrLogger as VerticalSlicePipeline;
      this.logger = logger;
    } else {
      this.pipeline = undefined;
      this.logger = pipelineOrLogger as ILogger;
    }
  }

  public async handleMessageFromWebview(
    message: unknown,
    postMessageResponse?: (msg: any) => void
  ): Promise<WebviewRpcResponse | void> {
    if (!message || typeof message !== 'object') {
      const errResp = this.createErrorResponse('INVALID_MSG', 'Message must be an object', 'unknown', 'REQUEST_SNAPSHOT');
      if (postMessageResponse) postMessageResponse(errResp);
      return errResp;
    }

    // Payload Size Guard (max 2MB)
    try {
      if (JSON.stringify(message).length > 2_097_152) {
        const errResp = this.createErrorResponse('PAYLOAD_TOO_LARGE', 'RPC payload exceeds maximum 2MB size limit', 'unknown', 'REQUEST_SNAPSHOT');
        if (postMessageResponse) postMessageResponse(errResp);
        return errResp;
      }
    } catch {
      const errResp = this.createErrorResponse('INVALID_MSG', 'Failed to parse message payload', 'unknown', 'REQUEST_SNAPSHOT');
      if (postMessageResponse) postMessageResponse(errResp);
      return errResp;
    }

    const msg = message as Record<string, any>;
    const command = msg.command as WebviewCommandType;
    const requestId = typeof msg.requestId === 'string' && msg.requestId.trim() ? msg.requestId.trim() : `req_${Date.now()}`;
    const payload = (msg.payload && typeof msg.payload === 'object' && !Array.isArray(msg.payload)) ? msg.payload : {};

    // 1. Validation
    if (!command || typeof command !== 'string' || !this.validCommands.has(command)) {
      this.logger?.warn(`[MessageBridge] Rejected unknown command: ${command}`);
      const errResp = this.createErrorResponse('UNKNOWN_COMMAND', `Command '${command}' is not supported`, requestId, command ?? 'REQUEST_SNAPSHOT');
      if (postMessageResponse) postMessageResponse(errResp);
      return errResp;
    }

    try {
      this.rpcMetrics.requestsReceived++;
      this.rpcMetrics.activeRequests++;
      this.rpcMetrics.lastRequestTimestamp = new Date().toISOString();

      let result: any = null;

      // TASK-059: SWITCH_TAB is a UI-only command that does not require a pipeline instance
      if (command === 'SWITCH_TAB') {
        result = { tab: payload.tab ?? 'dashboard', acknowledged: true };
        return this.createSuccessResponse(result, requestId, command);
      }

      if (!this.pipeline) {
        throw new Error('Pipeline instance not initialized');
      }

      switch (command) {
        case 'REQUEST_SNAPSHOT': {
          result = await this.pipeline.getLiveSnapshot(payload.activePath);
          break;
        }
        case 'RECORD_DECISION': {
          if (!payload.title || !payload.rationale) {
            throw new Error('RECORD_DECISION payload requires title and rationale');
          }
          result = await this.pipeline.recordDecision(
            payload.title,
            payload.rationale,
            payload.affectedFiles ?? []
          );
          break;
        }
        case 'SEARCH_MEMORIES': {
          if (typeof payload.query !== 'string') {
            throw new Error('SEARCH_MEMORIES payload requires string query');
          }
          result = this.pipeline.searchMemories(payload.query);
          break;
        }
        case 'GET_STORY': {
          if (!payload.symbolId) {
            throw new Error('GET_STORY payload requires symbolId');
          }
          result = await this.pipeline.getStory(payload.symbolId, payload.name, payload.filePath);
          break;
        }
        case 'GET_IMPACT': {
          if (!payload.filePath) {
            throw new Error('GET_IMPACT payload requires filePath');
          }
          result = this.pipeline.getImpact(payload.filePath);
          break;
        }
        case 'GET_DRIFT': {
          result = this.pipeline.getDrift(payload.filePath);
          break;
        }
        case 'GET_SESSION': {
          result = this.pipeline.getSession();
          break;
        }
        case 'ASK_ASSISTANT': {
          if (!payload.prompt) {
            throw new Error('ASK_ASSISTANT payload requires prompt string');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          const reqId = payload.requestId ?? requestId;
          const askRes = await assistantEngine.ask({
            requestId: reqId,
            conversationId: payload.conversationId,
            prompt: payload.prompt,
            activeFilePath: payload.activeFilePath,
            activeSymbolName: payload.activeSymbolName,
            options: payload.options,
          });

          if (askRes.isFailure) {
            throw askRes.error;
          }
          result = askRes.value;
          break;
        }
        case 'STREAM_ASSISTANT': {
          if (!payload.prompt) {
            throw new Error('STREAM_ASSISTANT payload requires prompt string');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          const reqId = payload.requestId ?? requestId;
          const convId = payload.conversationId ?? `conv_${Date.now()}`;

          // Pre-fetch empirical context to broadcast to Webview immediately
          const contextUsed = await assistantEngine.getContext({
            requestId: reqId,
            conversationId: convId,
            prompt: payload.prompt,
            activeFilePath: payload.activeFilePath,
            activeSymbolName: payload.activeSymbolName,
          });

          if (postMessageResponse) {
            postMessageResponse({
              command: 'ASSISTANT_STREAM_CHUNK',
              payload: {
                requestId: reqId,
                conversationId: convId,
                isComplete: false,
                contextUsed,
              },
            });
          }

          let accumulated = '';
          try {
            for await (const chunk of assistantEngine.stream({
              requestId: reqId,
              conversationId: convId,
              prompt: payload.prompt,
              activeFilePath: payload.activeFilePath,
              activeSymbolName: payload.activeSymbolName,
              options: payload.options,
            })) {
              if (chunk.contentDelta) {
                accumulated += chunk.contentDelta;
                if (postMessageResponse) {
                  postMessageResponse({
                    command: 'ASSISTANT_STREAM_CHUNK',
                    payload: {
                      requestId: reqId,
                      conversationId: convId,
                      contentDelta: chunk.contentDelta,
                      fullContent: accumulated,
                      isComplete: false,
                    },
                  });
                }
              }
            }

            const finalPayload = {
              requestId: reqId,
              conversationId: convId,
              fullContent: accumulated,
              isComplete: true,
              contextUsed,
            };

            if (postMessageResponse) {
              postMessageResponse({
                command: 'ASSISTANT_STREAM_CHUNK',
                payload: finalPayload,
              });
            }

            result = finalPayload;
          } catch (err: any) {
            const sanitizedErr = this.sanitizeErrorMessage(err.message ?? 'Streaming execution failed');
            const errPayload = {
              requestId: reqId,
              conversationId: convId,
              isComplete: true,
              error: sanitizedErr,
            };
            if (postMessageResponse) {
              postMessageResponse({
                command: 'ASSISTANT_STREAM_CHUNK',
                payload: errPayload,
              });
            }
            result = errPayload;
          }
          break;
        }
        case 'CANCEL_ASSISTANT': {
          if (!payload.requestId) {
            throw new Error('CANCEL_ASSISTANT payload requires requestId');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          assistantEngine.cancel(payload.requestId, payload.conversationId);
          result = { cancelled: true, requestId: payload.requestId };
          break;
        }
        case 'RESPOND_TOOL_APPROVAL': {
          if (!payload.approvalId || !payload.response) {
            throw new Error('RESPOND_TOOL_APPROVAL requires approvalId and response');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          const req = assistantEngine.respondToolApproval(payload.approvalId, payload.response);
          result = { approvalId: payload.approvalId, state: req?.state ?? 'EXPIRED' };
          break;
        }
        case 'LIST_PENDING_APPROVALS': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          const pending = assistantEngine.getPendingApprovals();
          result = { approvals: pending };
          break;
        }
        case 'GET_TOOL_AUDIT_TIMELINE': {
          if (!payload.conversationId) {
            throw new Error('GET_TOOL_AUDIT_TIMELINE requires conversationId');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          const entries = assistantEngine.getAuditTimeline(
            payload.conversationId,
            typeof payload.limit === 'number' ? payload.limit : 50
          );
          result = { conversationId: payload.conversationId, entries };
          break;
        }
        case 'GET_TOOL_AUDIT_ENTRY': {
          if (!payload.executionId) {
            throw new Error('GET_TOOL_AUDIT_ENTRY requires executionId');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          const entry = assistantEngine.getAuditEntry(payload.executionId);
          result = entry ?? null;
          break;
        }
        case 'QUERY_TOOL_EXECUTIONS': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          const cleanFilter = normalizeAnalyticsFilter(payload ?? {});
          result = await assistantEngine.queryToolExecutions({
            ...cleanFilter,
            limit: typeof payload?.limit === 'number' ? payload.limit : undefined,
            offset: typeof payload?.offset === 'number' ? payload.offset : undefined,
          });
          break;
        }
        case 'GET_TOOL_ANALYTICS': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = await assistantEngine.getToolAnalytics(normalizeAnalyticsFilter(payload ?? {}));
          break;
        }
        case 'GET_TOOL_VISUALIZATION': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          const cleanFilter = normalizeAnalyticsFilter(payload ?? {});
          const numBucketing = typeof payload?.numBuckets === 'number' ? Math.min(500, Math.max(1, payload.numBuckets)) : 12;
          result = await assistantEngine.getToolVisualization(cleanFilter, numBucketing);
          break;
        }
        case 'EXPORT_TOOL_EXECUTIONS_JSON': {
          // Returns ToolExecutionExportRow[] — secrets-free, no tool arguments included.
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = await assistantEngine.exportToolExecutionsJson(normalizeAnalyticsFilter(payload ?? {}));
          break;
        }
        case 'EXPORT_TOOL_EXECUTIONS_CSV': {
          // Returns RFC-4180 CSV string — secrets-free, no tool arguments included, formula injection protected.
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = await assistantEngine.exportToolExecutionsCsv(normalizeAnalyticsFilter(payload ?? {}));
          break;
        }
        case 'EXPORT_TOOL_EXECUTIONS_REPORT': {
          // Returns ToolExecutionReportJson — structured report with schema version metadata, analytics summary, and records array.
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = await assistantEngine.exportToolExecutionsReport(normalizeAnalyticsFilter(payload ?? {}));
          break;
        }
        case 'GET_SYSTEM_HEALTH':
        case 'REFRESH_SYSTEM_HEALTH': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = await assistantEngine.getSystemHealth(() => ({
            requestsReceived: this.rpcMetrics.requestsReceived,
            successfulResponses: this.rpcMetrics.successfulResponses,
            failedResponses: this.rpcMetrics.failedResponses,
            activeRequests: this.rpcMetrics.activeRequests,
            lastRequestTimestamp: this.rpcMetrics.lastRequestTimestamp,
          }));
          break;
        }
        case 'GET_ASSISTANT_CONTEXT': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = await assistantEngine.getContext({
            requestId,
            prompt: payload.prompt ?? '',
            activeFilePath: payload.activeFilePath,
            activeSymbolName: payload.activeSymbolName,
          });
          break;
        }
        case 'GET_ASSISTANT_CONVERSATION': {
          if (!payload.conversationId) {
            throw new Error('GET_ASSISTANT_CONVERSATION payload requires conversationId');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          const history = assistantEngine.getConversation(payload.conversationId);
          result = { conversationId: payload.conversationId, messages: history };
          break;
        }
        case 'CLEAR_ASSISTANT_CONVERSATION': {
          if (!payload.conversationId) {
            throw new Error('CLEAR_ASSISTANT_CONVERSATION payload requires conversationId');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          assistantEngine.clearConversation(payload.conversationId);
          result = { cleared: true, conversationId: payload.conversationId };
          break;
        }
        case 'LIST_ASSISTANT_CONVERSATIONS': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = assistantEngine.listConversations();
          break;
        }
        case 'CREATE_ASSISTANT_CONVERSATION': {
          const assistantEngine = this.pipeline.getAssistantEngine();
          result = assistantEngine.createConversation(payload.title);
          break;
        }
        case 'SWITCH_ASSISTANT_CONVERSATION': {
          if (!payload.conversationId) {
            throw new Error('SWITCH_ASSISTANT_CONVERSATION payload requires conversationId');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          const history = assistantEngine.getConversation(payload.conversationId);
          result = { conversationId: payload.conversationId, messages: history };
          break;
        }
        case 'DELETE_ASSISTANT_CONVERSATION': {
          if (!payload.conversationId) {
            throw new Error('DELETE_ASSISTANT_CONVERSATION payload requires conversationId');
          }
          const assistantEngine = this.pipeline.getAssistantEngine();
          assistantEngine.deleteConversation(payload.conversationId);
          result = { deleted: true, conversationId: payload.conversationId };
          break;
        }
      }

      this.rpcMetrics.successfulResponses++;
      this.rpcMetrics.activeRequests = Math.max(0, this.rpcMetrics.activeRequests - 1);

      const successResponse: WebviewRpcResponse = {
        requestId,
        command,
        success: true,
        result,
      };

      if (postMessageResponse) {
        postMessageResponse(successResponse);
      }

      return successResponse;
    } catch (err: any) {
      this.rpcMetrics.failedResponses++;
      this.rpcMetrics.activeRequests = Math.max(0, this.rpcMetrics.activeRequests - 1);

      const rawMsg = err.message ?? 'An error occurred while executing the command';
      if (this.logger && typeof this.logger.error === 'function') {
        this.logger.error(`[MessageBridge] Error processing command ${command}: ${rawMsg}`, err as Error);
      }
      const errorResponse: WebviewRpcResponse = {
        requestId,
        command,
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: this.sanitizeErrorMessage(rawMsg),
        },
      };

      if (postMessageResponse) {
        postMessageResponse(errorResponse);
      }

      return errorResponse;
    }
  }

  public sendToWebview(
    postMessage: (msg: any) => void,
    command: string,
    payload?: unknown
  ): void {
    this.logger?.info(`[MessageBridge] Sending broadcast to webview: ${command}`);
    postMessage({ command, payload });
  }

  private sanitizeErrorMessage(rawMessage?: string): string {
    if (!rawMessage) return 'An error occurred while executing the command';
    
    // 1. Redact API keys and authorization tokens (sk-*, Bearer, x-api-key, key=)
    let sanitized = rawMessage
      .replace(/sk-[a-zA-Z0-9_-]{20,}/g, 'sk-***REDACTED***')
      .replace(/x-api-key:[^\s\n,]+/gi, 'x-api-key:***REDACTED***')
      .replace(/key=[a-zA-Z0-9_-]{20,}/g, 'key=***REDACTED***')
      .replace(/Bearer\s+[a-zA-Z0-9_.-]{20,}/gi, 'Bearer ***REDACTED***');

    // 2. Redact absolute host filesystem paths (Windows drive letters & Unix root paths)
    sanitized = sanitized
      .replace(/[a-zA-Z]:[\\/](?:[^\\/:\*\?"<>\|]+[\\/])*/g, '[PATH_REDACTED]/')
      .replace(/\/(?:Users|home|root|var|tmp|private|etc)\/[^\s\n:'"]+/g, '[PATH_REDACTED]');

    return sanitized;
  }

  private createErrorResponse(
    code: string,
    message: string,
    requestId: string,
    command: WebviewCommandType
  ): WebviewRpcResponse {
    return {
      requestId,
      command,
      success: false,
      error: { code, message: this.sanitizeErrorMessage(message) },
    };
  }

  private createSuccessResponse(
    result: unknown,
    requestId: string,
    command: WebviewCommandType
  ): WebviewRpcResponse {
    this.rpcMetrics.successfulResponses++;
    this.rpcMetrics.activeRequests = Math.max(0, this.rpcMetrics.activeRequests - 1);
    return {
      requestId,
      command,
      success: true,
      result,
    };
  }
}
