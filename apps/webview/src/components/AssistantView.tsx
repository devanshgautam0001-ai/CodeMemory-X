import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Square,
  Trash2,
  Cpu,
  Wrench,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Brain,
  ShieldAlert,
  Zap,
  BookOpen,
  History,
  Info,
  Check,
  Copy,
  ArrowDown,
  RotateCcw,
  Search,
  Layers,
  AlertTriangle,
  Code2,
  Plus,
  MessageSquare,
  X,
  BarChart2,
  Clock,
  TrendingUp,
  Activity,
  Download,
  Loader2,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '@codememory/ui';
import { SystemHealthSnapshot } from '@codememory/shared';
import { useDashboardStore, AssistantMessageItem } from '../store/useDashboardStore.js';
import { rpcClient } from '../rpc/WebviewRpcClient.js';

export const AssistantView: React.FC = () => {
  const {
    assistantMessages,
    addAssistantMessage,
    updateStreamingMessage,
    setAssistantMessages,
    conversationsList,
    setConversationsList,
    activeConversationId,
    setActiveConversationId,
    isGenerating,
    setIsGenerating,
    currentRequestId,
    setCurrentRequestId,
    lastContextUsed,
    setLastContextUsed,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    enableTools,
    setEnableTools,
    clearConversationState,
    visualizationLoading,
    visualizationError,
    activeVisualizationRequestId,
    selectedBucketIndex,
    setSelectedBucketIndex,
    clearSelectedBucket,
  } = useDashboardStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [showContextInspector, setShowContextInspector] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [contextFilter, setContextFilter] = useState('');
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [showAuditTimeline, setShowAuditTimeline] = useState(false);
  const [expandedAuditEntry, setExpandedAuditEntry] = useState<string | null>(null);
  const [toolAnalytics, setToolAnalytics] = useState<any | null>(null);
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>('ALL');
  const [auditToolNameFilter, setAuditToolNameFilter] = useState<string>('');
  const [auditErrorCodeFilter, setAuditErrorCodeFilter] = useState<string>('ALL');
  const [auditApprovalStateFilter, setAuditApprovalStateFilter] = useState<string>('ALL');

  // TASK-050/052/058: Production History & System Health Panel state
  const PAGE_SIZE = 20;
  const [historyActiveTab, setHistoryActiveTab] = useState<'timeline' | 'analytics' | 'health'>('timeline');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyResults, setHistoryResults] = useState<{ items: any[]; total: number; hasMore: boolean }>({
    items: [],
    total: 0,
    hasMore: false,
  });
  const [historyTimeRange, setHistoryTimeRange] = useState<'ALL' | '1H' | '6H' | '24H' | '7D' | '30D'>('ALL');
  const [historyConvScope, setHistoryConvScope] = useState<'CURRENT' | 'ALL'>('CURRENT');
  const [historyAnalytics, setHistoryAnalytics] = useState<any | null>(null);
  const [historyVisualization, setHistoryVisualization] = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // TASK-058: System Health & Observability state
  const [systemHealth, setSystemHealth] = useState<SystemHealthSnapshot | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);
  const [expandedComponentId, setExpandedComponentId] = useState<string | null>(null);

  // TASK-056: Local Export & Reporting state
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatusMessage, setExportStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    completed: true,
    failed: true,
    avgLatency: true,
    total: false,
    cancelled: false,
    denied: false,
    expired: false,
  });

  const toggleSeries = (id: string) => {
    const currentCount = Object.values(visibleSeries).filter(Boolean).length;
    if (visibleSeries[id] && currentCount <= 1) {
      return; // Must keep at least 1 series visible
    }
    setVisibleSeries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const resetSeries = () => {
    setVisibleSeries({
      completed: true,
      failed: true,
      avgLatency: true,
      total: false,
      cancelled: false,
      denied: false,
      expired: false,
    });
  };

  const loadConversationsList = () => {
    rpcClient
      .sendRequest('LIST_ASSISTANT_CONVERSATIONS')
      .then((res) => {
        if (Array.isArray(res)) {
          setConversationsList(res);
        }
      })
      .catch((err) => {
        console.warn('[AssistantView] Failed to list conversations:', err);
      });
  };

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smart Auto-Scroll Logic
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsScrolledUp(!isAtBottom);
    if (isAtBottom) {
      setHasNewMessages(false);
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    setHasNewMessages(false);
    setIsScrolledUp(false);
  };

  // Keyboard Escape listener for selected bucket and expanded audit entry detail drawer (TASK-054/055)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBucketIndex !== null) {
          clearSelectedBucket();
        } else if (expandedAuditEntry) {
          setExpandedAuditEntry(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBucketIndex, expandedAuditEntry, clearSelectedBucket]);

  // Restore conversation history from Extension Host upon Webview mount / reload
  useEffect(() => {
    loadConversationsList();
    rpcClient
      .sendRequest('GET_ASSISTANT_CONVERSATION', { conversationId: activeConversationId })
      .then((res) => {
        if (res && Array.isArray(res.messages) && res.messages.length > 0) {
          setAssistantMessages(res.messages);
        }
      })
      .catch((err) => {
        console.warn('[AssistantView] Failed to fetch stored conversation history:', err);
      });

    // Recover any pending tool approvals that were active before Webview reload
    rpcClient
      .sendRequest('LIST_PENDING_APPROVALS', {})
      .then((res) => {
        if (res && Array.isArray(res.approvals) && res.approvals.length > 0) {
          const recoveredCards: AssistantMessageItem[] = res.approvals.map((appr: any) => ({
            id: `recovered_approval_${appr.approvalId}`,
            role: 'assistant' as const,
            content: '',
            timestamp: appr.requestedAt ?? new Date().toISOString(),
            pendingApproval: {
              approvalId: appr.approvalId,
              toolName: appr.toolName,
              arguments: appr.arguments,
            },
          }));
          const existingIds = new Set(assistantMessages.map((m) => m.id));
          const newCards = recoveredCards.filter((c) => !existingIds.has(c.id));
          if (newCards.length > 0) {
            setAssistantMessages([...assistantMessages, ...newCards]);
          }
        }
      })
      .catch((err) => {
        console.warn('[AssistantView] Failed to recover pending approvals:', err);
      });

    loadAuditTimeline();
    loadHistoryPage(0, 'ALL', 'CURRENT');
  }, [activeConversationId, setAssistantMessages]);

  const loadAuditTimeline = () => {
    rpcClient
      .sendRequest('GET_TOOL_AUDIT_TIMELINE', { conversationId: activeConversationId })
      .then((res) => {
        if (res && Array.isArray(res.entries)) {
          setAuditEntries(res.entries);
        }
      })
      .catch((err) => {
        console.warn('[AssistantView] Failed to fetch tool audit timeline:', err);
      });

    rpcClient
      .sendRequest('GET_TOOL_ANALYTICS', { conversationId: activeConversationId })
      .then((res) => {
        if (res) {
          setToolAnalytics(res);
        }
      })
      .catch((err) => {
        console.warn('[AssistantView] Failed to fetch tool analytics:', err);
      });
  };

  // TASK-050/054: time range helpers
  const getTimeRangeTimestamps = (
    range: 'ALL' | '1H' | '6H' | '24H' | '7D' | '30D',
  ): { fromTimestamp?: number; toTimestamp?: number } => {
    if (range === 'ALL') return {};
    const now = Date.now();
    const durations: Record<string, number> = {
      '1H': 3_600_000,
      '6H': 21_600_000,
      '24H': 86_400_000,
      '7D': 604_800_000,
      '30D': 2_592_000_000,
    };
    return { fromTimestamp: now - (durations[range] ?? 0), toTimestamp: now };
  };

  const loadHistoryPage = (
    page: number,
    timeRange: 'ALL' | '1H' | '6H' | '24H' | '7D' | '30D',
    convScope: 'CURRENT' | 'ALL',
    statusFilter?: string,
    toolFilter?: string,
    errorCodeFilter?: string,
    approvalStateFilter?: string,
    customFromTimestamp?: number,
    customToTimestamp?: number,
  ) => {
    setHistoryLoading(true);
    setHistoryError(null);

    const resolvedStatus = statusFilter ?? auditStatusFilter;
    const resolvedTool = toolFilter ?? auditToolNameFilter;
    const resolvedErrorCode = errorCodeFilter ?? auditErrorCodeFilter;
    const resolvedApprovalState = approvalStateFilter ?? auditApprovalStateFilter;
    const timeTs = typeof customFromTimestamp === 'number' && typeof customToTimestamp === 'number'
      ? { fromTimestamp: customFromTimestamp, toTimestamp: customToTimestamp }
      : getTimeRangeTimestamps(timeRange);
    const payload: Record<string, unknown> = {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
      ...timeTs,
    };
    if (resolvedStatus !== 'ALL') payload.status = resolvedStatus;
    if (resolvedTool.trim()) payload.toolName = resolvedTool.trim();
    if (resolvedErrorCode !== 'ALL' && resolvedErrorCode.trim()) payload.errorCode = resolvedErrorCode.trim();
    if (resolvedApprovalState !== 'ALL' && resolvedApprovalState.trim()) payload.approvalState = resolvedApprovalState.trim();
    if (convScope === 'CURRENT') payload.conversationId = activeConversationId;

    const analyticsPayload: Record<string, unknown> = { ...timeTs };
    if (convScope === 'CURRENT') analyticsPayload.conversationId = activeConversationId;
    if (resolvedTool.trim()) analyticsPayload.toolName = resolvedTool.trim();
    if (resolvedStatus !== 'ALL') analyticsPayload.status = resolvedStatus;
    if (resolvedErrorCode !== 'ALL' && resolvedErrorCode.trim()) analyticsPayload.errorCode = resolvedErrorCode.trim();
    if (resolvedApprovalState !== 'ALL' && resolvedApprovalState.trim()) analyticsPayload.approvalState = resolvedApprovalState.trim();

    const pQuery = rpcClient.sendRequest('QUERY_TOOL_EXECUTIONS', payload);
    const pAnalytics = rpcClient.sendRequest('GET_TOOL_ANALYTICS', analyticsPayload);
    const pViz = rpcClient.sendRequest('GET_TOOL_VISUALIZATION', { ...analyticsPayload, numBuckets: 12 });

    Promise.allSettled([pQuery, pAnalytics, pViz])
      .then(([rQuery, rAnalytics, rViz]) => {
        let hasError = false;

        if (rQuery.status === 'fulfilled' && rQuery.value && Array.isArray(rQuery.value.items)) {
          setHistoryResults({
            items: rQuery.value.items,
            total: rQuery.value.total ?? 0,
            hasMore: rQuery.value.hasMore ?? false,
          });
        } else if (rQuery.status === 'rejected') {
          hasError = true;
        }

        if (rAnalytics.status === 'fulfilled' && rAnalytics.value) {
          setHistoryAnalytics(rAnalytics.value);
        } else if (rAnalytics.status === 'rejected') {
          hasError = true;
        }

        if (rViz.status === 'fulfilled' && rViz.value) {
          setHistoryVisualization(rViz.value);
        } else if (rViz.status === 'rejected') {
          hasError = true;
        }

        if (hasError) {
          setHistoryError('Failed to load complete tool execution analytics from Extension Host.');
        }
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  // TASK-058: System Health fetch handler
  const fetchSystemHealth = (isRefresh = false) => {
    setIsRefreshingHealth(true);
    const cmd = isRefresh ? 'REFRESH_SYSTEM_HEALTH' : 'GET_SYSTEM_HEALTH';
    rpcClient
      .sendRequest(cmd)
      .then((res: any) => {
        if (res && res.overallStatus) {
          setSystemHealth(res);
        }
      })
      .catch((err) => console.warn('[AssistantView] Failed to fetch system health:', err))
      .finally(() => {
        setIsRefreshingHealth(false);
      });
  };

  // TASK-051/052/056: local export handlers — build payload from current filters and active chart bucket, fetch and trigger browser download
  const buildExportPayload = (): Record<string, unknown> => {
    let timeTs = getTimeRangeTimestamps(historyTimeRange);
    if (selectedBucketIndex !== null && historyVisualization?.series) {
      const bStart = historyVisualization.fromTimestamp + selectedBucketIndex * historyVisualization.bucketSizeMs;
      const bEnd = bStart + historyVisualization.bucketSizeMs;
      timeTs = { fromTimestamp: bStart, toTimestamp: bEnd };
    }
    const payload: Record<string, unknown> = { ...timeTs };
    if (historyConvScope === 'CURRENT') payload.conversationId = activeConversationId;
    if (auditStatusFilter !== 'ALL') payload.status = auditStatusFilter;
    if (auditToolNameFilter.trim()) payload.toolName = auditToolNameFilter.trim();
    if (auditErrorCodeFilter !== 'ALL' && auditErrorCodeFilter.trim()) payload.errorCode = auditErrorCodeFilter.trim();
    if (auditApprovalStateFilter !== 'ALL' && auditApprovalStateFilter.trim()) payload.approvalState = auditApprovalStateFilter.trim();
    return payload;
  };

  const handleExportJson = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatusMessage(null);
    try {
      const rows = await rpcClient.sendRequest('EXPORT_TOOL_EXECUTIONS_JSON', buildExportPayload());
      if (!Array.isArray(rows)) {
        throw new Error('Malformed export response');
      }
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tool-executions-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatusMessage({ type: 'success', text: `Exported ${rows.length} records to JSON` });
    } catch (err) {
      console.error('[AssistantView] Export JSON failed:', err);
      setExportStatusMessage({ type: 'error', text: 'Failed to export JSON' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportReportJson = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatusMessage(null);
    try {
      const report = await rpcClient.sendRequest('EXPORT_TOOL_EXECUTIONS_REPORT', buildExportPayload());
      if (!report || !report.metadata) {
        throw new Error('Malformed report response');
      }
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tool-execution-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatusMessage({ type: 'success', text: `Exported structured JSON report (${report.metadata.totalExportedRecords} records)` });
    } catch (err) {
      console.error('[AssistantView] Export Report JSON failed:', err);
      setExportStatusMessage({ type: 'error', text: 'Failed to export structured report' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportStatusMessage(null);
    try {
      const csv = await rpcClient.sendRequest('EXPORT_TOOL_EXECUTIONS_CSV', buildExportPayload());
      if (typeof csv !== 'string') {
        throw new Error('Malformed CSV response');
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tool-executions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatusMessage({ type: 'success', text: 'Exported records to CSV' });
    } catch (err) {
      console.error('[AssistantView] Export CSV failed:', err);
      setExportStatusMessage({ type: 'error', text: 'Failed to export CSV' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await rpcClient.sendRequest('CREATE_ASSISTANT_CONVERSATION', { title: `Conversation ${conversationsList.length + 1}` });
      if (res && res.id) {
        setActiveConversationId(res.id);
        setAssistantMessages([
          {
            id: `msg_welcome_${Date.now()}`,
            role: 'assistant',
            content: 'New conversation created. How can I assist you with your codebase?',
            timestamp: new Date().toISOString(),
          },
        ]);
        loadConversationsList();
      }
    } catch (err: any) {
      console.warn('[AssistantView] Failed to create new conversation:', err);
    }
  };

  const handleSwitchConversation = async (convId: string) => {
    if (convId === activeConversationId) return;

    if (isGenerating && currentRequestId) {
      rpcClient.cancelRequest(currentRequestId, 'Conversation switched');
      setIsGenerating(false);
      setCurrentRequestId(null);
    }

    try {
      const res = await rpcClient.sendRequest('SWITCH_ASSISTANT_CONVERSATION', { conversationId: convId });
      if (res && Array.isArray(res.messages)) {
        setActiveConversationId(convId);
        setAssistantMessages(res.messages);
      }
    } catch (err: any) {
      console.warn('[AssistantView] Failed to switch conversation:', err);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating && currentRequestId && convId === activeConversationId) {
      rpcClient.cancelRequest(currentRequestId, 'Conversation deleted');
      setIsGenerating(false);
      setCurrentRequestId(null);
    }
    try {
      await rpcClient.sendRequest('DELETE_ASSISTANT_CONVERSATION', { conversationId: convId });
      loadConversationsList();
      if (convId === activeConversationId) {
        handleNewConversation();
      }
    } catch (err: any) {
      console.warn('[AssistantView] Failed to delete conversation:', err);
    }
  };

  useEffect(() => {
    if (!isScrolledUp) {
      scrollToBottom();
    } else {
      setHasNewMessages(true);
    }
  }, [assistantMessages, isGenerating]);

  const handleSend = async (customPrompt?: string) => {
    const userPrompt = (customPrompt ?? inputPrompt).trim();
    if (!userPrompt) return;

    if (isGenerating && currentRequestId) {
      rpcClient.cancelRequest(currentRequestId, 'New prompt submitted');
    }

    if (!customPrompt) setInputPrompt('');

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setCurrentRequestId(requestId);

    const userMsg: AssistantMessageItem = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toISOString(),
    };
    addAssistantMessage(userMsg);
    setIsGenerating(true);
    setIsScrolledUp(false);

    // Initial assistant placeholder message for live token streaming
    const placeholderMsg: AssistantMessageItem = {
      id: `msg_ast_${requestId}`,
      requestId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    addAssistantMessage(placeholderMsg);

    try {
      await rpcClient.streamRequest(
        'STREAM_ASSISTANT',
        {
          requestId,
          conversationId: activeConversationId,
          prompt: userPrompt,
          options: {
            provider: selectedProvider,
            model: selectedModel,
            enableTools,
            temperature: 0.2,
          },
        },
        (chunkPayload) => {
          updateStreamingMessage(requestId, chunkPayload);
        },
        120000,
        30000
      );
    } catch (err: any) {
      updateStreamingMessage(requestId, {
        isComplete: true,
        error: err.message ?? 'Streaming response failed',
      });
    } finally {
      setIsGenerating(false);
      setCurrentRequestId(null);
      loadAuditTimeline();
      loadHistoryPage(0, historyTimeRange, historyConvScope);
    }
  };

  const handleStop = async () => {
    if (currentRequestId) {
      rpcClient.cancelRequest(currentRequestId, 'User clicked Stop');
    }
    setIsGenerating(false);
    setCurrentRequestId(null);
  };

  const handleConfirmClear = async () => {
    try {
      await rpcClient.sendRequest('CLEAR_ASSISTANT_CONVERSATION', { conversationId: activeConversationId });
    } catch {
      // Ignore clear rpc errors
    }
    clearConversationState();
    setShowClearModal(false);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleToolExpanded = (toolId: string) => {
    setExpandedTools((prev) => ({ ...prev, [toolId]: !prev[toolId] }));
  };

  const providers = [
    { id: 'ollama', label: 'Ollama (Local)', model: 'llama3' },
    { id: 'openai', label: 'OpenAI', model: 'gpt-4o' },
    { id: 'claude', label: 'Anthropic Claude', model: 'claude-3-5-sonnet' },
    { id: 'gemini', label: 'Google Gemini', model: 'gemini-1.5-pro' },
    { id: 'lmstudio', label: 'LM Studio (Local)', model: 'local-model' },
  ];

  const suggestedPrompts = [
    'What am I currently working on in this workspace?',
    'Are there any architectural drift warnings in my active session?',
    'What is the evolution history of the active symbol?',
    'Search memories for recent ADR decisions and rationales',
  ];

  // Token Budget percentage calculation
  const tokenBudgetMax = 4096;
  const tokenCount = lastContextUsed?.totalTokens ?? 0;
  const tokenPercent = Math.min(100, Math.round((tokenCount / tokenBudgetMax) * 100));

  // Filtered context items
  const filteredMemories = useMemo(() => {
    if (!lastContextUsed?.memories) return [];
    if (!contextFilter.trim()) return lastContextUsed.memories;
    const query = contextFilter.toLowerCase();
    return lastContextUsed.memories.filter((m: any) =>
      (m.summary ?? m.memory?.summary ?? '').toLowerCase().includes(query)
    );
  }, [lastContextUsed, contextFilter]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between p-4 bg-card-bg/60 border border-border rounded-xl backdrop-blur-md shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-accent/20 text-accent rounded-lg border border-accent/30">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary flex items-center space-x-2">
              <span>AI Coding Assistant</span>
              <Badge variant="success">Production Hardened</Badge>
            </h2>
            <p className="text-[11px] text-text-secondary font-mono">
              Empirical Context Layer • Vector Query • Tool Runtime • Real Token Streaming
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Provider Selector */}
          <div className="flex items-center space-x-2 bg-hover/60 px-3 py-1.5 rounded-lg border border-border text-xs">
            <Cpu size={14} className="text-accent" />
            <select
              value={selectedProvider}
              onChange={(e) => {
                const prov = providers.find((p) => p.id === e.target.value);
                if (prov) {
                  setSelectedProvider(prov.id);
                  setSelectedModel(prov.model);
                }
              }}
              className="bg-transparent text-text-primary outline-none cursor-pointer font-medium"
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} className="bg-card-bg text-text-primary">
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model Badge */}
          <span className="font-mono text-xs px-2.5 py-1 bg-accent/10 text-accent rounded-md border border-accent/20">
            {selectedModel}
          </span>

          {/* Enable Tools Toggle */}
          <button
            onClick={() => setEnableTools(!enableTools)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              enableTools
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-xs'
                : 'bg-hover text-text-secondary border-border'
            }`}
            title="Toggle Tool Runtime (search_memories, get_symbol_story, get_change_impact, etc.)"
          >
            <Wrench size={13} />
            <span>Tools: {enableTools ? 'ON' : 'OFF'}</span>
          </button>

          {/* New Chat Button */}
          <button
            onClick={handleNewConversation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-xs font-semibold transition-all shadow-xs"
            title="Create new conversation"
          >
            <Plus size={13} />
            <span>New Chat</span>
          </button>

          {/* Conversations History Drawer Toggle */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showHistoryDrawer
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-hover text-text-secondary border-border'
            }`}
            title="Toggle Conversations History Drawer"
          >
            <History size={13} />
            <span>History ({conversationsList.length})</span>
          </button>

          {/* Context Inspector Toggle */}
          <button
            onClick={() => setShowContextInspector(!showContextInspector)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showContextInspector
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-hover text-text-secondary border-border'
            }`}
          >
            <Info size={13} />
            <span>Context ({tokenCount} Tokens)</span>
            {showContextInspector ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Tool Execution History Toggle */}
          <button
            onClick={() => {
              const nextState = !showAuditTimeline;
              setShowAuditTimeline(nextState);
              if (nextState) {
                loadAuditTimeline();
                loadHistoryPage(0, historyTimeRange, historyConvScope);
              }
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              showAuditTimeline
                ? 'bg-accent/20 text-accent border-accent/40'
                : 'bg-hover text-text-secondary border-border'
            }`}
            title="Toggle Tool Execution History"
          >
            <BarChart2 size={13} />
            <span>History ({historyResults.total})</span>
            {showAuditTimeline ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Clear Conversation Trigger */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearModal(true)}
            className="text-text-secondary hover:text-red-400"
            title="Clear Conversation"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>

      {/* 2. Main Content Grid (Messages + Optional Context Inspector) */}
      <div className="flex-1 flex space-x-4 min-h-0 overflow-hidden relative">
        {/* Conversations History Drawer */}
        {showHistoryDrawer && (
          <div className="w-64 bg-card-bg/60 border border-border rounded-xl p-3 overflow-y-auto space-y-3 text-xs font-mono shadow-md">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-text-primary flex items-center space-x-1.5">
                <History size={14} className="text-accent" />
                <span>Conversations</span>
              </h3>
              <Badge variant="accent">{conversationsList.length}</Badge>
            </div>

            <div className="space-y-1">
              {conversationsList.map((conv: any) => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSwitchConversation(conv.id)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-accent/15 border-accent/40 text-accent font-semibold'
                        : 'bg-hover/40 border-border text-text-secondary hover:text-text-primary hover:bg-hover'
                    }`}
                  >
                    <div className="truncate flex items-center space-x-2">
                      <MessageSquare size={13} className={isActive ? 'text-accent' : 'text-text-secondary'} />
                      <span className="truncate">{conv.title ?? 'Conversation'}</span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 transition-opacity"
                      title="Delete conversation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}

              {conversationsList.length === 0 && (
                <p className="text-[10px] text-text-secondary italic text-center py-4">No stored conversations</p>
              )}
            </div>
          </div>
        )}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          role="log"
          aria-live="polite"
          className="flex-1 flex flex-col min-h-0 bg-card-bg/30 border border-border rounded-xl p-4 overflow-y-auto space-y-4 relative"
        >
          {/* Welcome / Empty State Prompt Suggestions */}
          {assistantMessages.length <= 1 && (
            <div className="my-auto py-8 text-center space-y-4 max-w-xl mx-auto">
              <div className="p-3 bg-accent/15 text-accent rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-accent/30">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">CodeMemory X AI Assistant</h3>
                <p className="text-xs text-text-secondary mt-1">
                  Answers developer questions using real codebase memories, symbol evolution stories, developer sessions, and architectural drift sentinel warnings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-2">
                {suggestedPrompts.map((promptText, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSend(promptText)}
                    className="p-3 bg-hover/50 hover:bg-hover border border-border hover:border-accent/40 rounded-xl text-xs text-text-primary transition-all flex items-start space-x-2 text-left group"
                  >
                    <Code2 size={14} className="text-accent mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {assistantMessages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 space-y-3 border text-xs leading-relaxed ${
                    isUser
                      ? 'bg-accent/20 border-accent/30 text-text-primary rounded-br-none'
                      : msg.error
                      ? 'bg-red-500/10 border-red-500/30 text-red-300 rounded-bl-none'
                      : 'bg-card-bg border-border text-text-primary rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono pb-1 border-b border-border/40">
                    <span className="flex items-center space-x-1.5 font-bold uppercase tracking-wider">
                      {isUser ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                          <span>Developer</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={11} className={`text-accent ${msg.isStreaming ? 'animate-spin' : ''}`} />
                          <span>CodeMemory X Assistant {msg.isStreaming ? '(Thinking…)' : ''}</span>
                        </>
                      )}
                    </span>

                    <div className="flex items-center space-x-2">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="hover:text-text-primary transition-colors"
                          title="Copy response"
                        >
                          {copiedIndex === idx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Executed Read-Only Tools Cards */}
                  {msg.toolCallsExecuted && msg.toolCallsExecuted.length > 0 && (
                    <div className="space-y-1.5 py-1">
                      {msg.toolCallsExecuted.map((tc: any, tIdx: number) => {
                        const toolKey = `${msg.id}_t_${tIdx}`;
                        const isExpanded = expandedTools[toolKey] ?? false;
                        return (
                          <div
                            key={tIdx}
                            className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-[11px] font-mono space-y-1 text-emerald-300"
                          >
                            <div
                              onClick={() => toggleToolExpanded(toolKey)}
                              className="flex items-center justify-between cursor-pointer select-none"
                            >
                              <span className="flex items-center space-x-1.5 font-semibold">
                                <Wrench size={12} />
                                <span>Tool Executed: {tc.name ?? tc.toolName}</span>
                                <Badge variant="success">Read-Only</Badge>
                              </span>
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </div>

                            {isExpanded && (
                              <div className="pt-1.5 border-t border-emerald-500/20 space-y-1 text-[10px] text-emerald-200">
                                <div>Arguments: {JSON.stringify(tc.arguments ?? tc.args ?? {})}</div>
                                {tc.result && <div>Result: {JSON.stringify(tc.result).substring(0, 150)}...</div>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pending Tool Approval Card */}
                  {(msg as any).pendingApproval && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2 text-amber-200">
                      <div className="flex items-center justify-between font-semibold text-xs">
                        <span className="flex items-center space-x-1.5">
                          <ShieldAlert size={14} className="text-amber-400" />
                          <span>Tool Confirmation Required: {(msg as any).pendingApproval.toolName}</span>
                        </span>
                        <Badge variant="warning">Requires Confirmation</Badge>
                      </div>
                      <div className="text-[10px] font-mono bg-black/20 p-2 rounded border border-amber-500/20 text-amber-300">
                        Arguments: {JSON.stringify((msg as any).pendingApproval.arguments ?? {})}
                      </div>
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={async () => {
                            const approvalId = (msg as any).pendingApproval.approvalId;
                            try {
                              await rpcClient.sendRequest('RESPOND_TOOL_APPROVAL', {
                                approvalId,
                                response: 'APPROVED',
                              });
                              // Optimistically dismiss the approval card
                              setAssistantMessages(assistantMessages.filter((m) => m.id !== msg.id));
                              loadAuditTimeline();
                            } catch (e) {
                              console.error('[AssistantView] Failed to approve tool:', e);
                            }
                          }}
                          className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-lg text-emerald-300 font-semibold text-[11px] transition-all flex items-center space-x-1"
                        >
                          <Check size={12} />
                          <span>Approve Execution</span>
                        </button>
                        <button
                          onClick={async () => {
                            const approvalId = (msg as any).pendingApproval.approvalId;
                            try {
                              await rpcClient.sendRequest('RESPOND_TOOL_APPROVAL', {
                                approvalId,
                                response: 'DENIED',
                              });
                              // Optimistically dismiss the approval card
                              setAssistantMessages(assistantMessages.filter((m) => m.id !== msg.id));
                              loadAuditTimeline();
                            } catch (e) {
                              console.error('[AssistantView] Failed to deny tool:', e);
                            }
                          }}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-300 font-semibold text-[11px] transition-all flex items-center space-x-1"
                        >
                          <X size={12} />
                          <span>Deny Execution</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Message Content with Cursor when Streaming */}
                  <div className="whitespace-pre-wrap font-sans text-xs">
                    {msg.content || (msg.isStreaming ? 'Thinking…' : '')}
                    {msg.isStreaming && <span className="inline-block w-2 h-3.5 ml-1 bg-accent animate-pulse align-middle"></span>}
                  </div>

                  {/* Error & Retry Banner */}
                  {msg.error && (
                    <div className="flex items-center justify-between p-2 bg-red-500/20 rounded-lg border border-red-500/30 text-red-200 text-[11px]">
                      <span className="flex items-center space-x-1.5">
                        <AlertTriangle size={13} />
                        <span>{msg.error}</span>
                      </span>
                      <button
                        onClick={() => handleSend(msg.content)}
                        className="flex items-center space-x-1 px-2 py-0.5 bg-red-500/30 hover:bg-red-500/40 rounded text-[10px] font-mono transition-colors"
                      >
                        <RotateCcw size={10} />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating "New Messages" Pill when scrolled up */}
        {hasNewMessages && isScrolledUp && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-accent text-card-bg font-bold font-mono text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-1.5 hover:scale-105 transition-transform z-20"
          >
            <ArrowDown size={13} />
            <span>New messages below</span>
          </button>
        )}

        {/* 3. Context Inspector Sidebar */}
        {showContextInspector && (
          <div className="w-80 bg-card-bg/60 border border-border rounded-xl p-4 overflow-y-auto space-y-4 text-xs font-mono shadow-md">
            <div className="space-y-2 border-b border-border pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary flex items-center space-x-1.5">
                  <Brain size={14} className="text-accent" />
                  <span>Context Inspector</span>
                </h3>
                <span className="text-[10px] text-text-secondary">
                  {tokenCount} / {tokenBudgetMax} Tokens
                </span>
              </div>

              {/* Token Progress Bar */}
              <div className="w-full bg-hover rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    tokenPercent > 80 ? 'bg-amber-400' : 'bg-accent'
                  }`}
                  style={{ width: `${tokenPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Context Search Filter Input */}
            <div className="flex items-center space-x-1.5 bg-hover px-2 py-1.5 rounded-lg border border-border text-[11px]">
              <Search size={12} className="text-text-secondary" />
              <input
                type="text"
                value={contextFilter}
                onChange={(e) => setContextFilter(e.target.value)}
                placeholder="Filter context items..."
                className="bg-transparent text-text-primary outline-none w-full"
              />
            </div>

            {/* Context Section: Memories */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-accent flex items-center space-x-1">
                <BookOpen size={12} />
                <span>Memories ({filteredMemories.length})</span>
              </h4>
              {filteredMemories.length ? (
                <div className="space-y-1">
                  {filteredMemories.slice(0, 4).map((m: any, i: number) => {
                    const scoreMeta = lastContextUsed?.evidenceScores?.[m.id];
                    return (
                      <div key={i} className="p-2 bg-hover/50 rounded border border-border text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="truncate">{m.summary ?? m.memory?.summary ?? 'Memory Item'}</span>
                          {scoreMeta && (
                            <div className="flex items-center space-x-1">
                              <Badge variant={scoreMeta.priority === 'CRITICAL' ? 'warning' : 'accent'}>
                                {scoreMeta.priority}
                              </Badge>
                              <Badge variant="accent">Score {scoreMeta.score}</Badge>
                            </div>
                          )}
                        </div>
                        {scoreMeta?.signals && (
                          <div className="text-[9px] text-text-secondary truncate">
                            {scoreMeta.signals.join(' • ')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-text-secondary italic">No memory items match</p>
              )}
            </div>

            {/* Context Section: Symbol Story */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-accent flex items-center space-x-1">
                <History size={12} />
                <span>Symbol Evolution Story</span>
              </h4>
              {lastContextUsed?.symbolStory ? (
                <div className="p-2 bg-hover/50 rounded border border-border text-[11px] space-y-1">
                  <div>Symbol: {lastContextUsed.symbolStory.symbolName}</div>
                  <div>Birth: {lastContextUsed.symbolStory.birth?.commitHash ?? 'observed'}</div>
                </div>
              ) : (
                <p className="text-[10px] text-text-secondary italic">No active symbol story selected</p>
              )}
            </div>

            {/* Context Section: Active Session */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-accent flex items-center space-x-1">
                <Zap size={12} />
                <span>Active Session Focus</span>
              </h4>
              {lastContextUsed?.sessionSummary ? (
                <div className="p-2 bg-hover/50 rounded border border-border text-[11px] space-y-1">
                  <div>Session: {lastContextUsed.sessionSummary.sessionId}</div>
                  <div>State: {lastContextUsed.sessionSummary.state}</div>
                </div>
              ) : (
                <p className="text-[10px] text-text-secondary italic">No active session summary</p>
              )}
            </div>

            {/* Context Section: Drift Sentinel Warnings */}
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-semibold text-amber-400 flex items-center space-x-1">
                <ShieldAlert size={12} />
                <span>Drift Warnings ({lastContextUsed?.driftFindings?.length ?? 0})</span>
              </h4>
              {lastContextUsed?.driftFindings?.length ? (
                <div className="space-y-1">
                  {lastContextUsed.driftFindings.slice(0, 2).map((f: any, i: number) => (
                    <div key={i} className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded text-[11px]">
                      {f.description ?? f.type}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-text-secondary italic">0 architectural drift findings</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Tool Execution History Panel — Production Grade (TASK-050) */}
      {showAuditTimeline && (
        <div className="bg-card-bg/60 border border-border rounded-xl shadow-md overflow-hidden flex-shrink-0">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-hover/30">
            <div className="flex items-center space-x-2.5">
              <BarChart2 size={14} className="text-accent" />
              <h3 className="text-xs font-bold text-text-primary">Tool Execution History</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/20">
                {historyResults.total} execution{historyResults.total !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              {/* Tab switcher */}
              <div className="flex items-center bg-hover rounded-lg border border-border p-0.5 text-[11px] font-medium">
                <button
                  onClick={() => setHistoryActiveTab('timeline')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    historyActiveTab === 'timeline'
                      ? 'bg-accent text-card-bg shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setHistoryActiveTab('analytics')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    historyActiveTab === 'analytics'
                      ? 'bg-accent text-card-bg shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => {
                    setHistoryActiveTab('health');
                    fetchSystemHealth();
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    historyActiveTab === 'health'
                      ? 'bg-accent text-card-bg shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  System Health
                </button>
              </div>
              {/* Export buttons (TASK-051/056) */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleExportJson}
                  disabled={isExporting}
                  className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-hover border border-border text-[10px] font-mono text-text-secondary hover:text-accent hover:border-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Export executions as flat JSON"
                  aria-label="Export executions as flat JSON"
                >
                  <Download size={11} />
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleExportReportJson}
                  disabled={isExporting}
                  className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-hover border border-border text-[10px] font-mono text-text-secondary hover:text-accent hover:border-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Export structured JSON report with metadata"
                  aria-label="Export structured JSON report with metadata"
                >
                  <Download size={11} />
                  <span>Report</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-hover border border-border text-[10px] font-mono text-text-secondary hover:text-accent hover:border-accent/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Export executions as RFC-4180 CSV"
                  aria-label="Export executions as RFC-4180 CSV"
                >
                  <Download size={11} />
                  <span>CSV</span>
                </button>
              </div>
              <button
                onClick={() => setShowAuditTimeline(false)}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors rounded"
                title="Close history panel"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* ── Timeline Tab ── */}
          {historyActiveTab === 'timeline' && (
            <div className="p-3 space-y-3">
              {/* Filter Controls */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Status filter chips */}
                <div className="flex items-center flex-wrap gap-1">
                  {(
                    [
                      { key: 'ALL', label: 'All' },
                      { key: 'COMPLETED', label: 'Success' },
                      { key: 'FAILED', label: 'Failed' },
                      { key: 'CANCELLED', label: 'Cancelled' },
                      { key: 'DENIED', label: 'Denied' },
                      { key: 'EXPIRED', label: 'Expired' },
                    ] as { key: string; label: string }[]
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setAuditStatusFilter(key);
                        setHistoryPage(0);
                        loadHistoryPage(0, historyTimeRange, historyConvScope, key, auditToolNameFilter);
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                        auditStatusFilter === key
                          ? key === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : key === 'FAILED' || key === 'DENIED'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : key === 'CANCELLED' || key === 'EXPIRED'
                            ? 'bg-text-secondary/20 text-text-secondary border-border'
                            : 'bg-accent/20 text-accent border-accent/40'
                          : 'bg-hover text-text-secondary border-border hover:text-text-primary hover:bg-hover/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Tool name search */}
                  <div className="flex items-center space-x-1.5 bg-hover/80 border border-border rounded-lg px-2 py-1 text-[10px]">
                    <Search size={11} className="text-text-secondary shrink-0" />
                    <input
                      type="text"
                      value={auditToolNameFilter}
                      onChange={(e) => setAuditToolNameFilter(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, e.currentTarget.value);
                        }
                      }}
                      placeholder="Search tool..."
                      className="bg-transparent text-text-primary outline-none w-28 font-mono"
                    />
                  </div>
                  {/* Approval state filter */}
                  <select
                    value={auditApprovalStateFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAuditApprovalStateFilter(v);
                      setHistoryPage(0);
                      loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, v);
                    }}
                    className="bg-hover/80 text-text-primary border border-border rounded-lg px-2 py-1 text-[10px] outline-none font-mono"
                  >
                    <option value="ALL">All Approvals</option>
                    <option value="REQUIRED">Approval Required</option>
                    <option value="APPROVED">Approved</option>
                    <option value="DENIED">Denied</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="WAITING">Waiting Approval</option>
                    <option value="NONE">Not Required</option>
                  </select>

                  {/* Error code filter */}
                  <select
                    value={auditErrorCodeFilter}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAuditErrorCodeFilter(v);
                      setHistoryPage(0);
                      loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, v, auditApprovalStateFilter);
                    }}
                    className="bg-hover/80 text-text-primary border border-border rounded-lg px-2 py-1 text-[10px] outline-none font-mono"
                  >
                    <option value="ALL">All Error Codes</option>
                    {Object.keys(historyAnalytics?.errorCountsByCode ?? {}).map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>

                  {/* Time range */}
                  <select
                    value={historyTimeRange}
                    onChange={(e) => {
                      const v = e.target.value as typeof historyTimeRange;
                      setHistoryTimeRange(v);
                      setHistoryPage(0);
                      loadHistoryPage(0, v, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                    }}
                    className="bg-hover/80 text-text-primary border border-border rounded-lg px-2 py-1 text-[10px] outline-none font-mono"
                  >
                    <option value="ALL">All Time</option>
                    <option value="1H">Last 1h</option>
                    <option value="6H">Last 6h</option>
                    <option value="24H">Last 24h</option>
                    <option value="7D">Last 7 days</option>
                    <option value="30D">Last 30 days</option>
                  </select>
                  {/* Conversation scope */}
                  <select
                    value={historyConvScope}
                    onChange={(e) => {
                      const v = e.target.value as typeof historyConvScope;
                      setHistoryConvScope(v);
                      setHistoryPage(0);
                      loadHistoryPage(0, historyTimeRange, v, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                    }}
                    className="bg-hover/80 text-text-primary border border-border rounded-lg px-2 py-1 text-[10px] outline-none font-mono"
                  >
                    <option value="CURRENT">This Conversation</option>
                    <option value="ALL">All Conversations</option>
                  </select>
                </div>
              </div>

              {/* History RPC Error Alert Banner (TASK-057) */}
              {historyError && (
                <div aria-live="assertive" className="flex items-center justify-between px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] font-mono text-red-300">
                  <span className="flex items-center space-x-1.5">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span>{historyError}</span>
                  </span>
                  <button
                    onClick={() => loadHistoryPage(historyPage, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter)}
                    className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}
              {(auditStatusFilter !== 'ALL' ||
                auditToolNameFilter.trim() !== '' ||
                auditErrorCodeFilter !== 'ALL' ||
                auditApprovalStateFilter !== 'ALL') && (
                <div className="flex items-center space-x-2 text-[10px] font-mono bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-lg">
                  <span className="text-accent font-semibold">Active Filters:</span>
                  {auditStatusFilter !== 'ALL' && (
                    <span className="flex items-center space-x-1 bg-accent/20 text-accent px-2 py-0.5 rounded">
                      <span>Status: {auditStatusFilter}</span>
                      <button
                        onClick={() => {
                          setAuditStatusFilter('ALL');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, 'ALL', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                        }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {auditToolNameFilter.trim() !== '' && (
                    <span className="flex items-center space-x-1 bg-accent/20 text-accent px-2 py-0.5 rounded">
                      <span>Tool: {auditToolNameFilter}</span>
                      <button
                        onClick={() => {
                          setAuditToolNameFilter('');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, '', auditErrorCodeFilter, auditApprovalStateFilter);
                        }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {auditErrorCodeFilter !== 'ALL' && (
                    <span className="flex items-center space-x-1 bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                      <span>Error: {auditErrorCodeFilter}</span>
                      <button
                        onClick={() => {
                          setAuditErrorCodeFilter('ALL');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, 'ALL', auditApprovalStateFilter);
                        }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  {auditApprovalStateFilter !== 'ALL' && (
                    <span className="flex items-center space-x-1 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                      <span>Approval: {auditApprovalStateFilter}</span>
                      <button
                        onClick={() => {
                          setAuditApprovalStateFilter('ALL');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, 'ALL');
                        }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setAuditStatusFilter('ALL');
                      setAuditToolNameFilter('');
                      setAuditErrorCodeFilter('ALL');
                      setAuditApprovalStateFilter('ALL');
                      setHistoryPage(0);
                      loadHistoryPage(0, historyTimeRange, historyConvScope, 'ALL', '', 'ALL', 'ALL');
                    }}
                    className="text-text-secondary hover:text-text-primary underline ml-auto"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Execution Table */}
              {historyResults.items.length > 0 ? (
                <>
                  <div className="rounded-lg border border-border overflow-hidden text-[11px]">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-hover/60 text-text-secondary text-left text-[10px] font-semibold uppercase tracking-wide">
                          <th className="px-3 py-2">Tool</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2 text-right">Duration</th>
                          <th className="px-3 py-2 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {historyResults.items.map((entry: any) => {
                          const isExpanded = expandedAuditEntry === entry.executionId;
                          return (
                            <React.Fragment key={entry.executionId}>
                              <tr
                                onClick={() =>
                                  setExpandedAuditEntry(isExpanded ? null : entry.executionId)
                                }
                                className="hover:bg-hover/40 cursor-pointer transition-colors"
                              >
                                <td className="px-3 py-2 font-mono font-semibold text-text-primary max-w-[200px]">
                                  <span className="flex items-center space-x-1.5 truncate">
                                    <Wrench size={11} className="text-accent shrink-0" />
                                    <span className="truncate">{entry.toolName}</span>
                                  </span>
                                </td>
                                <td className="px-3 py-2">
                                  {entry.status === 'COMPLETED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                                      Completed
                                    </span>
                                  )}
                                  {entry.status === 'FAILED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-semibold">
                                      {entry.errorCode ? `Failed: ${entry.errorCode}` : 'Failed'}
                                    </span>
                                  )}
                                  {entry.status === 'WAITING_APPROVAL' && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold animate-pulse">
                                      Waiting Approval
                                    </span>
                                  )}
                                  {entry.status === 'APPROVED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                                      Approved
                                    </span>
                                  )}
                                  {entry.status === 'DENIED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-semibold">
                                      Denied
                                    </span>
                                  )}
                                  {entry.status === 'EXPIRED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-text-secondary/10 text-text-secondary border border-border text-[10px] font-semibold">
                                      Expired
                                    </span>
                                  )}
                                  {entry.status === 'CANCELLED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-text-secondary/10 text-text-secondary border border-border text-[10px] font-semibold">
                                      Cancelled
                                    </span>
                                  )}
                                  {entry.status === 'STARTED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30 text-[10px] font-semibold animate-pulse">
                                      Executing
                                    </span>
                                  )}
                                  {entry.status === 'REQUESTED' && (
                                    <span className="px-2 py-0.5 rounded-full bg-text-secondary/10 text-text-secondary border border-border text-[10px] font-semibold">
                                      Requested
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-text-secondary">
                                  {entry.durationMs != null ? `${entry.durationMs}ms` : '\u2014'}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-text-secondary">
                                  {new Date(entry.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-hover/20">
                                  <td colSpan={4} className="px-4 py-3 space-y-2">
                                    {/* Lifecycle Progress Stepper (TASK-052) */}
                                    <div className="flex items-center space-x-2 py-1 text-[10px] font-mono border-b border-border/40 pb-2">
                                      <span className="font-semibold text-accent">Lifecycle:</span>
                                      <div className="flex items-center space-x-1.5 flex-1">
                                        <span className="px-2 py-0.5 rounded bg-hover text-text-primary border border-border">
                                          1. Requested
                                        </span>
                                        <ChevronRight size={10} className="text-text-secondary" />
                                        {entry.approvalRequestId ? (
                                          <span className={`px-2 py-0.5 rounded border ${
                                            entry.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                                            entry.status === 'DENIED' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                                            entry.status === 'EXPIRED' ? 'bg-text-secondary/20 text-text-secondary border-border' :
                                            'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                          }`}>
                                            2. Approval: {entry.status}
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 rounded bg-hover text-text-secondary border border-border">
                                            2. Approval: Not Required
                                          </span>
                                        )}
                                        <ChevronRight size={10} className="text-text-secondary" />
                                        <span className={`px-2 py-0.5 rounded border ${
                                          entry.startedAt ? 'bg-accent/20 text-accent border-accent/40' : 'bg-hover text-text-secondary border-border'
                                        }`}>
                                          3. Executing
                                        </span>
                                        <ChevronRight size={10} className="text-text-secondary" />
                                        <span className={`px-2 py-0.5 rounded border ${
                                          entry.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                                          entry.status === 'FAILED' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                                          'bg-hover text-text-secondary border-border'
                                        }`}>
                                          4. {entry.status}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-mono text-text-secondary">
                                      <div className="flex items-center space-x-1">
                                        <span className="text-accent">Execution ID: </span>
                                        <span className="truncate">{entry.executionId}</span>
                                        <button
                                          onClick={() => navigator.clipboard?.writeText(entry.executionId)}
                                          className="p-0.5 hover:text-text-primary text-text-secondary"
                                          title="Copy Execution ID"
                                        >
                                          <Copy size={9} />
                                        </button>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <span className="text-accent">Request ID: </span>
                                        <span className="truncate">{entry.requestId}</span>
                                        <button
                                          onClick={() => navigator.clipboard?.writeText(entry.requestId)}
                                          className="p-0.5 hover:text-text-primary text-text-secondary"
                                          title="Copy Request ID"
                                        >
                                          <Copy size={9} />
                                        </button>
                                      </div>
                                      <div>
                                        <span className="text-accent">Sequence: </span>#{entry.sequence}
                                      </div>
                                      {entry.approvalRequestId && (
                                        <div className="flex items-center space-x-1">
                                          <span className="text-accent">Approval ID: </span>
                                          <span className="truncate">{entry.approvalRequestId}</span>
                                          <button
                                            onClick={() => navigator.clipboard?.writeText(entry.approvalRequestId)}
                                            className="p-0.5 hover:text-text-primary text-text-secondary"
                                            title="Copy Approval ID"
                                          >
                                            <Copy size={9} />
                                          </button>
                                        </div>
                                      )}
                                      <div>
                                        <span className="text-accent">Created: </span>
                                        {new Date(entry.createdAt).toLocaleTimeString()}
                                      </div>
                                      {entry.startedAt && (
                                        <div>
                                          <span className="text-accent">Started: </span>
                                          {new Date(entry.startedAt).toLocaleTimeString()}
                                        </div>
                                      )}
                                      {entry.completedAt && (
                                        <div>
                                          <span className="text-accent">Completed: </span>
                                          {new Date(entry.completedAt).toLocaleTimeString()}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary pt-0.5">
                    <span>
                      {historyResults.total} execution{historyResults.total !== 1 ? 's' : ''} total
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const p = Math.max(0, historyPage - 1);
                          setHistoryPage(p);
                          loadHistoryPage(p, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter);
                        }}
                        disabled={historyPage === 0}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-hover border border-border font-medium disabled:opacity-40 hover:bg-hover/80 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={11} />
                        <span>Previous</span>
                      </button>
                      <span className="px-2 py-0.5 bg-hover/60 rounded border border-border">
                        Page {historyPage + 1}
                      </span>
                      <button
                        onClick={() => {
                          const p = historyPage + 1;
                          setHistoryPage(p);
                          loadHistoryPage(p, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter);
                        }}
                        disabled={!historyResults.hasMore}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-hover border border-border font-medium disabled:opacity-40 hover:bg-hover/80 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight size={11} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-text-secondary text-[11px] space-y-2">
                  <Clock size={24} className="mx-auto opacity-20" />
                  <p>
                    No tool executions recorded
                    {historyConvScope === 'CURRENT' ? ' for this conversation' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Analytics Tab ── */}
          {historyActiveTab === 'analytics' && historyAnalytics && (
            <div className="p-4 space-y-4">
              {/* Time Series Throughput & Latency Visualization Chart (TASK-053/054) */}
              {historyVisualization && historyVisualization.series && (
                <div className="bg-hover/30 rounded-xl border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                    <span className="flex items-center space-x-1.5">
                      <Activity size={12} className="text-accent" />
                      <span>Execution Throughput &amp; Latency Over Time</span>
                    </span>

                    {/* Interactive Legend Controls (TASK-054) */}
                    <div className="flex items-center flex-wrap gap-2 text-[9px] font-mono">
                      {[
                        { id: 'completed', label: 'Completed', color: 'bg-emerald-500' },
                        { id: 'failed', label: 'Failed', color: 'bg-red-500' },
                        { id: 'cancelled', label: 'Cancelled', color: 'bg-text-secondary' },
                        { id: 'denied', label: 'Denied', color: 'bg-orange-500' },
                        { id: 'expired', label: 'Expired', color: 'bg-amber-500' },
                        { id: 'avgLatency', label: 'Latency (ms)', color: 'bg-accent' },
                      ].map(({ id, label, color }) => (
                        <button
                          key={id}
                          onClick={() => toggleSeries(id)}
                          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-all border ${
                            visibleSeries[id]
                              ? 'bg-hover text-text-primary border-border'
                              : 'opacity-40 text-text-secondary border-transparent line-through'
                          }`}
                          title={`Toggle ${label} series`}
                        >
                          <span className={`w-2 h-2 rounded-sm ${color} inline-block`} />
                          <span>{label}</span>
                        </button>
                      ))}
                      <button
                        onClick={resetSeries}
                        className="text-text-secondary hover:text-text-primary underline ml-1"
                        title="Reset all legend series"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Accessible Screen Reader Summary */}
                  <p className="sr-only">
                    Execution analytics time-series chart from {new Date(historyVisualization.fromTimestamp).toLocaleTimeString()} to {new Date(historyVisualization.toTimestamp).toLocaleTimeString()}. Total executions: {historyVisualization.totalExecutions ?? 0}. Successful: {historyVisualization.completedCount ?? 0}. Failed: {historyVisualization.failedCount ?? 0}. Average latency: {historyVisualization.avgDurationMs ?? 0} ms.
                  </p>

                  <div className="w-full overflow-x-auto">
                    {(() => {
                      const getPoints = (id: string) => historyVisualization.series.find((s: any) => s.id === id)?.points ?? [];
                      const completedSeries = getPoints('completed');
                      const failedSeries = getPoints('failed');
                      const cancelledSeries = getPoints('cancelled');
                      const deniedSeries = getPoints('denied');
                      const expiredSeries = getPoints('expired');
                      const latencySeries = getPoints('avgLatency');
                      const pointsCount = completedSeries.length;
                      if (pointsCount === 0) return null;

                      let maxExecutions = 0;
                      let maxLatency = 0;
                      for (let i = 0; i < pointsCount; i++) {
                        const comp = visibleSeries.completed ? (completedSeries[i]?.value ?? 0) : 0;
                        const fail = visibleSeries.failed ? (failedSeries[i]?.value ?? 0) : 0;
                        const canc = visibleSeries.cancelled ? (cancelledSeries[i]?.value ?? 0) : 0;
                        const den = visibleSeries.denied ? (deniedSeries[i]?.value ?? 0) : 0;
                        const exp = visibleSeries.expired ? (expiredSeries[i]?.value ?? 0) : 0;
                        const tot = comp + fail + canc + den + exp;
                        if (tot > maxExecutions) maxExecutions = tot;
                        const lat = visibleSeries.avgLatency ? (latencySeries[i]?.value ?? 0) : 0;
                        if (lat > maxLatency) maxLatency = lat;
                      }

                      const safeMaxExecutions = maxExecutions === 0 ? 1 : maxExecutions;
                      const safeMaxLatency = maxLatency === 0 ? 1 : maxLatency;

                      const chartHeight = 110;
                      const chartWidth = 500;
                      const paddingLeft = 32;
                      const paddingRight = 32;
                      const paddingBottom = 20;
                      const plotWidth = chartWidth - paddingLeft - paddingRight;
                      const plotHeight = chartHeight - paddingBottom;
                      const numPoints = Math.max(1, completedSeries.length);
                      const barGroupWidth = plotWidth / numPoints;
                      const barWidth = Math.max(2, Math.min(16, barGroupWidth - 4));

                      const polylinePoints = latencySeries
                        .map((pt: any, i: number) => {
                          const x = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
                          const val = pt.value ?? 0;
                          const y = plotHeight - (val / safeMaxLatency) * (plotHeight - 10);
                          return `${x},${y}`;
                        })
                        .join(' ');

                      return (
                        <svg
                          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                          preserveAspectRatio="none"
                          className="w-full h-32 text-[9px] font-mono"
                          role="graphics-document"
                          aria-label="Interactive Tool Execution Analytics Chart"
                        >
                          {/* Grid lines */}
                          <line x1={paddingLeft} y1={0} x2={chartWidth - paddingRight} y2={0} stroke="currentColor" strokeOpacity={0.1} />
                          <line x1={paddingLeft} y1={plotHeight / 2} x2={chartWidth - paddingRight} y2={plotHeight / 2} stroke="currentColor" strokeOpacity={0.1} />
                          <line x1={paddingLeft} y1={plotHeight} x2={chartWidth - paddingRight} y2={plotHeight} stroke="currentColor" opacity={0.3} />

                          {/* Left Y Axis (Volume) */}
                          <text x={paddingLeft - 4} y={10} fill="currentColor" opacity={0.6} textAnchor="end" fontSize={8}>
                            {maxExecutions}
                          </text>
                          <text x={paddingLeft - 4} y={plotHeight} fill="currentColor" opacity={0.6} textAnchor="end" fontSize={8}>
                            0
                          </text>

                          {/* Right Y Axis (Latency ms) */}
                          <text x={chartWidth - paddingRight + 4} y={10} fill="var(--color-accent, #6366f1)" opacity={0.8} textAnchor="start" fontSize={8}>
                            {maxLatency}ms
                          </text>
                          <text x={chartWidth - paddingRight + 4} y={plotHeight} fill="var(--color-accent, #6366f1)" opacity={0.8} textAnchor="start" fontSize={8}>
                            0ms
                          </text>

                          {/* Bars per bucket */}
                          {completedSeries.map((pt: any, i: number) => {
                            const comp = visibleSeries.completed ? (completedSeries[i]?.value ?? 0) : 0;
                            const fail = visibleSeries.failed ? (failedSeries[i]?.value ?? 0) : 0;
                            const den = visibleSeries.denied ? (deniedSeries[i]?.value ?? 0) : 0;
                            const exp = visibleSeries.expired ? (expiredSeries[i]?.value ?? 0) : 0;
                            const tot = comp + fail + den + exp;
                            const lat = latencySeries[i]?.value ?? 0;

                            const x = paddingLeft + i * barGroupWidth + (barGroupWidth - barWidth) / 2;
                            const compH = (comp / safeMaxExecutions) * plotHeight;
                            const failH = (fail / safeMaxExecutions) * plotHeight;
                            const timeLabel = new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            const isSelected = selectedBucketIndex === i;
                            const tooltipText = `Bucket #${i + 1} (${timeLabel})\nTotal: ${tot}\nCompleted: ${comp}\nFailed: ${fail}\nDenied: ${den}\nExpired: ${exp}\nAvg Latency: ${lat}ms (Click to inspect)`;

                            return (
                              <g
                                key={i}
                                tabIndex={0}
                                role="graphics-symbol"
                                aria-label={tooltipText}
                                onClick={() => setSelectedBucketIndex(isSelected ? null : i)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedBucketIndex(isSelected ? null : i);
                                  }
                                }}
                                className={`focus:outline-none focus:stroke-accent focus:stroke-2 hover:opacity-80 transition-opacity cursor-pointer ${
                                  isSelected ? 'opacity-100 stroke-accent stroke-[1.5]' : ''
                                }`}
                              >
                                {compH > 0 && (
                                  <rect x={x} y={plotHeight - compH} width={barWidth} height={compH} fill="#10b981" rx={1}>
                                    <title>{tooltipText}</title>
                                  </rect>
                                )}
                                {failH > 0 && (
                                  <rect x={x} y={plotHeight - compH - failH} width={barWidth} height={failH} fill="#ef4444" rx={1}>
                                    <title>{tooltipText}</title>
                                  </rect>
                                )}
                                <text x={paddingLeft + i * barGroupWidth + barGroupWidth / 2} y={plotHeight + 14} fill="currentColor" opacity={0.6} textAnchor="middle" fontSize={7}>
                                  {timeLabel}
                                </text>
                              </g>
                            );
                          })}

                          {/* Latency line & dots */}
                          {visibleSeries.avgLatency && maxLatency > 0 && (
                            <>
                              <polyline fill="none" stroke="var(--color-accent, #6366f1)" strokeWidth="1.5" strokeDasharray="3,3" points={polylinePoints} />
                              {latencySeries.map((pt: any, i: number) => {
                                const x = paddingLeft + i * barGroupWidth + barGroupWidth / 2;
                                const val = pt.value ?? 0;
                                const y = plotHeight - (val / safeMaxLatency) * (plotHeight - 10);
                                return (
                                  <circle key={i} cx={x} cy={y} r={2} fill="var(--color-accent, #6366f1)">
                                    <title>{`Time: ${new Date(pt.timestamp).toLocaleTimeString()}\nAvg Latency: ${val} ms`}</title>
                                  </circle>
                                );
                              })}
                            </>
                          )}
                        </svg>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Bucket Detail Inspector Panel (TASK-055) */}
              {selectedBucketIndex !== null && historyVisualization?.series && (() => {
                const bIndex = selectedBucketIndex;
                const getPoints = (id: string) => historyVisualization.series.find((s: any) => s.id === id)?.points ?? [];
                const completedPts = getPoints('completed');
                if (bIndex < 0 || bIndex >= completedPts.length) return null;

                const bStart = historyVisualization.fromTimestamp + bIndex * historyVisualization.bucketSizeMs;
                const bEnd = bStart + historyVisualization.bucketSizeMs;

                const getVal = (id: string) => getPoints(id)[bIndex]?.value ?? 0;
                const bTotal = getVal('total');
                const bComp = getVal('completed');
                const bFail = getVal('failed');
                const bCanc = getVal('cancelled');
                const bDen = getVal('denied');
                const bExp = getVal('expired');
                const bAvgLat = getVal('avgLatency');
                const bMinLat = getVal('minLatency');
                const bMaxLat = getVal('maxLatency');
                const bSRate = getVal('successRate');

                return (
                  <div className="bg-accent/10 border border-accent/40 rounded-xl p-3 space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-accent flex items-center space-x-1.5">
                        <Layers size={13} />
                        <span>Bucket Detail Inspector (Bucket #{bIndex + 1})</span>
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setHistoryPage(0);
                            loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter, bStart, bEnd);
                            setHistoryActiveTab('timeline');
                          }}
                          className="px-2 py-0.5 rounded bg-accent text-white text-[10px] hover:bg-accent/80 transition-colors font-sans"
                          title="Filter Timeline view to this bucket interval"
                        >
                          Filter Timeline to Bucket
                        </button>
                        <button
                          onClick={clearSelectedBucket}
                          className="p-1 hover:bg-hover rounded text-text-secondary hover:text-text-primary"
                          title="Clear selection (Escape)"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] text-text-secondary">
                      <div>
                        <span className="text-text-primary font-semibold">Time Interval:</span>
                        <br />
                        {new Date(bStart).toLocaleTimeString()} – {new Date(bEnd).toLocaleTimeString()}
                      </div>
                      <div>
                        <span className="text-text-primary font-semibold">Executions:</span> {bTotal}
                        <br />
                        <span className="text-emerald-400">Completed: {bComp}</span> | <span className="text-red-400">Failed: {bFail}</span>
                      </div>
                      <div>
                        <span className="text-text-primary font-semibold">Latency:</span>
                        <br />
                        Avg: {bAvgLat}ms (Min: {bMinLat}ms, Max: {bMaxLat}ms)
                      </div>
                      <div>
                        <span className="text-text-primary font-semibold">Approvals:</span>
                        <br />
                        Denied: {bDen} | Expired: {bExp}
                      </div>
                      <div>
                        <span className="text-text-primary font-semibold">Cancelled:</span> {bCanc}
                      </div>
                      <div>
                        <span className="text-text-primary font-semibold">Success Rate:</span>
                        <br />
                        <span className="text-emerald-400 font-bold">{(bSRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Top metrics grid */}
              <div className="grid grid-cols-4 gap-3">
                {/* Success Rate */}
                <div className="bg-hover/50 rounded-xl border border-border p-3 space-y-2">
                  <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide flex items-center space-x-1">
                    <TrendingUp size={11} />
                    <span>Success Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {Math.round((historyAnalytics.successRate ?? 0) * 100)}%
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.round((historyAnalytics.successRate ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Latency Stats (TASK-052 min/avg/max) */}
                <div className="bg-hover/50 rounded-xl border border-border p-3 space-y-1.5">
                  <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide flex items-center space-x-1">
                    <Clock size={11} />
                    <span>Latency Metrics</span>
                  </div>
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Min</span>
                      <span className="font-bold text-accent">{historyAnalytics.minDurationMs ?? 0} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Avg</span>
                      <span className="font-bold text-accent">{historyAnalytics.avgDurationMs ?? 0} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Max</span>
                      <span className="font-bold text-accent">{historyAnalytics.maxDurationMs ?? 0} ms</span>
                    </div>
                  </div>
                </div>

                {/* Execution counts */}
                <div className="bg-hover/50 rounded-xl border border-border p-3 space-y-1.5">
                  <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                    Executions
                  </div>
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div
                      onClick={() => {
                        setAuditStatusFilter('COMPLETED');
                        setHistoryActiveTab('timeline');
                        setHistoryPage(0);
                        loadHistoryPage(0, historyTimeRange, historyConvScope, 'COMPLETED', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                      }}
                      className="flex justify-between cursor-pointer hover:bg-hover/60 px-1 py-0.5 rounded transition-colors"
                      title="Filter by COMPLETED status"
                    >
                      <span className="text-emerald-400">Completed</span>
                      <span className="font-bold">{historyAnalytics.successCount ?? 0}</span>
                    </div>
                    <div
                      onClick={() => {
                        setAuditStatusFilter('FAILED');
                        setHistoryActiveTab('timeline');
                        setHistoryPage(0);
                        loadHistoryPage(0, historyTimeRange, historyConvScope, 'FAILED', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                      }}
                      className="flex justify-between cursor-pointer hover:bg-hover/60 px-1 py-0.5 rounded transition-colors"
                      title="Filter by FAILED status"
                    >
                      <span className="text-red-400">Failed</span>
                      <span className="font-bold">{historyAnalytics.failureCount ?? 0}</span>
                    </div>
                    <div
                      onClick={() => {
                        setAuditStatusFilter('WAITING_APPROVAL');
                        setHistoryActiveTab('timeline');
                        setHistoryPage(0);
                        loadHistoryPage(0, historyTimeRange, historyConvScope, 'WAITING_APPROVAL', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                      }}
                      className="flex justify-between cursor-pointer hover:bg-hover/60 px-1 py-0.5 rounded transition-colors"
                      title="Filter by WAITING_APPROVAL status"
                    >
                      <span className="text-amber-400">Waiting</span>
                      <span className="font-bold">{historyAnalytics.waitingApprovalCount ?? 0}</span>
                    </div>
                  </div>
                </div>

                {/* Approval stats */}
                <div className="bg-hover/50 rounded-xl border border-border p-3 space-y-1.5">
                  <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                    Approvals
                  </div>
                  <div className="space-y-0.5 text-[11px] font-mono">
                    <div
                      onClick={() => {
                        setAuditApprovalStateFilter('APPROVED');
                        setHistoryActiveTab('timeline');
                        setHistoryPage(0);
                        loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, 'APPROVED');
                      }}
                      className="flex justify-between cursor-pointer hover:bg-hover/60 px-1 py-0.5 rounded transition-colors"
                      title="Filter by APPROVED approval state"
                    >
                      <span className="text-emerald-400">Approved</span>
                      <span className="font-bold">{historyAnalytics.approvalCount ?? 0}</span>
                    </div>
                    <div
                      onClick={() => {
                        setAuditApprovalStateFilter('DENIED');
                        setHistoryActiveTab('timeline');
                        setHistoryPage(0);
                        loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, 'DENIED');
                      }}
                      className="flex justify-between cursor-pointer hover:bg-hover/60 px-1 py-0.5 rounded transition-colors"
                      title="Filter by DENIED approval state"
                    >
                      <span className="text-red-400">Denied</span>
                      <span className="font-bold">{historyAnalytics.deniedCount ?? 0}</span>
                    </div>
                    <div
                      onClick={() => {
                        setAuditApprovalStateFilter('EXPIRED');
                        setHistoryActiveTab('timeline');
                        setHistoryPage(0);
                        loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, auditErrorCodeFilter, 'EXPIRED');
                      }}
                      className="flex justify-between cursor-pointer hover:bg-hover/60 px-1 py-0.5 rounded transition-colors"
                      title="Filter by EXPIRED approval state"
                    >
                      <span className="text-text-secondary">Expired</span>
                      <span className="font-bold">{historyAnalytics.expiredCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Distribution Bar */}
              {historyAnalytics.totalCount > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide flex items-center justify-between">
                    <span>Status Distribution</span>
                    <span className="text-[9px] font-normal text-text-secondary">(Click segment to filter)</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden w-full border border-border/40 cursor-pointer">
                    {historyAnalytics.successCount > 0 && (
                      <div
                        onClick={() => {
                          setAuditStatusFilter('COMPLETED');
                          setHistoryActiveTab('timeline');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, 'COMPLETED', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 transition-all"
                        style={{
                          width: `${(historyAnalytics.successCount / historyAnalytics.totalCount) * 100}%`,
                        }}
                        title={`Completed: ${historyAnalytics.successCount} (Click to filter)`}
                      />
                    )}
                    {historyAnalytics.failureCount > 0 && (
                      <div
                        onClick={() => {
                          setAuditStatusFilter('FAILED');
                          setHistoryActiveTab('timeline');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, 'FAILED', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                        }}
                        className="bg-red-500 hover:bg-red-400 transition-all"
                        style={{
                          width: `${(historyAnalytics.failureCount / historyAnalytics.totalCount) * 100}%`,
                        }}
                        title={`Failed: ${historyAnalytics.failureCount} (Click to filter)`}
                      />
                    )}
                    {historyAnalytics.deniedCount > 0 && (
                      <div
                        onClick={() => {
                          setAuditStatusFilter('DENIED');
                          setHistoryActiveTab('timeline');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, 'DENIED', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                        }}
                        className="bg-orange-500 hover:bg-orange-400 transition-all"
                        style={{
                          width: `${(historyAnalytics.deniedCount / historyAnalytics.totalCount) * 100}%`,
                        }}
                        title={`Denied: ${historyAnalytics.deniedCount} (Click to filter)`}
                      />
                    )}
                    {historyAnalytics.waitingApprovalCount > 0 && (
                      <div
                        onClick={() => {
                          setAuditStatusFilter('WAITING_APPROVAL');
                          setHistoryActiveTab('timeline');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, 'WAITING_APPROVAL', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 transition-all"
                        style={{
                          width: `${(historyAnalytics.waitingApprovalCount / historyAnalytics.totalCount) * 100}%`,
                        }}
                        title={`Waiting: ${historyAnalytics.waitingApprovalCount} (Click to filter)`}
                      />
                    )}
                    {historyAnalytics.expiredCount > 0 && (
                      <div
                        onClick={() => {
                          setAuditStatusFilter('EXPIRED');
                          setHistoryActiveTab('timeline');
                          setHistoryPage(0);
                          loadHistoryPage(0, historyTimeRange, historyConvScope, 'EXPIRED', auditToolNameFilter, auditErrorCodeFilter, auditApprovalStateFilter);
                        }}
                        className="bg-text-secondary/40 hover:bg-text-secondary/60 transition-all"
                        style={{
                          width: `${(historyAnalytics.expiredCount / historyAnalytics.totalCount) * 100}%`,
                        }}
                        title={`Expired: ${historyAnalytics.expiredCount} (Click to filter)`}
                      />
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[9px] text-text-secondary">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      <span>Completed</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      <span>Failed</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                      <span>Denied</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      <span>Waiting</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Per-tool breakdown */}
              {(historyAnalytics.byTool ?? []).length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide flex items-center justify-between">
                    <span>Per-Tool Breakdown</span>
                    <span className="text-[9px] font-normal text-text-secondary">(Click row to filter tool)</span>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden text-[11px]">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-hover/60 text-text-secondary text-left text-[10px] font-semibold uppercase tracking-wide">
                          <th className="px-3 py-2">Tool</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-right">Success</th>
                          <th className="px-3 py-2 text-right">Failed</th>
                          <th className="px-3 py-2 text-right">Avg ms</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(historyAnalytics.byTool as any[] ?? []).map(
                          (metrics: any) => (
                            <tr
                              key={metrics.toolName}
                              onClick={() => {
                                setAuditToolNameFilter(metrics.toolName);
                                setHistoryActiveTab('timeline');
                                setHistoryPage(0);
                                loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, metrics.toolName, auditErrorCodeFilter, auditApprovalStateFilter);
                              }}
                              className="hover:bg-hover/40 cursor-pointer transition-colors group"
                            >
                              <td className="px-3 py-1.5 font-mono text-text-primary group-hover:text-accent font-semibold">
                                {metrics.toolName}
                              </td>
                              <td className="px-3 py-1.5 text-right font-mono text-text-secondary">
                                {metrics.totalExecutions}
                              </td>
                              <td className="px-3 py-1.5 text-right font-mono text-emerald-400">
                                {metrics.successCount}
                              </td>
                              <td className="px-3 py-1.5 text-right font-mono text-red-400">
                                {metrics.failureCount}
                              </td>
                              <td className="px-3 py-1.5 text-right font-mono text-accent">
                                {metrics.avgDurationMs ?? '\u2014'}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Error code distribution (Interactive cross-filter, TASK-052) */}
                  {Object.keys(historyAnalytics.errorCountsByCode ?? {}).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide flex items-center justify-between">
                        <span>Error Code Distribution</span>
                        <span className="text-[9px] font-normal text-text-secondary">(Click to filter)</span>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(
                          historyAnalytics.errorCountsByCode as Record<string, number>,
                        ).map(([code, count]) => (
                          <div
                            key={code}
                            onClick={() => {
                              setAuditErrorCodeFilter(code);
                              setHistoryActiveTab('timeline');
                              setHistoryPage(0);
                              loadHistoryPage(0, historyTimeRange, historyConvScope, auditStatusFilter, auditToolNameFilter, code, auditApprovalStateFilter);
                            }}
                            className="flex items-center justify-between px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] font-mono cursor-pointer hover:bg-red-500/20 transition-colors group"
                          >
                            <span className="text-red-300 group-hover:underline">{code}</span>
                            <span className="text-red-400 font-bold">{count}×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Report Preview & Export UX Card (TASK-056) */}
              <div className="bg-hover/30 rounded-xl border border-border p-3 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wide">
                  <span className="flex items-center space-x-1.5">
                    <Download size={12} className="text-accent" />
                    <span>Report Preview &amp; Local Export</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={handleExportCsv}
                      disabled={isExporting}
                      className="px-2 py-0.5 rounded bg-hover border border-border text-text-primary hover:border-accent/40 disabled:opacity-40 text-[10px] transition-colors"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportJson}
                      disabled={isExporting}
                      className="px-2 py-0.5 rounded bg-hover border border-border text-text-primary hover:border-accent/40 disabled:opacity-40 text-[10px] transition-colors"
                    >
                      Export Flat JSON
                    </button>
                    <button
                      onClick={handleExportReportJson}
                      disabled={isExporting}
                      className="px-2 py-0.5 rounded bg-accent text-white hover:bg-accent/80 disabled:opacity-40 text-[10px] transition-colors font-sans"
                    >
                      Export Report JSON
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-text-secondary bg-hover/40 p-2 rounded-lg border border-border/40">
                  <div>
                    <span className="text-text-primary font-semibold">Scope:</span> {historyConvScope === 'CURRENT' ? 'This Conversation' : 'All Conversations'}
                    <br />
                    <span className="text-text-primary font-semibold">Tool:</span> {auditToolNameFilter.trim() || 'All Tools'}
                  </div>
                  <div>
                    <span className="text-text-primary font-semibold">Status:</span> {auditStatusFilter}
                    <br />
                    <span className="text-text-primary font-semibold">Error:</span> {auditErrorCodeFilter}
                  </div>
                  <div>
                    <span className="text-text-primary font-semibold">Export Count:</span> {historyAnalytics.totalCount} records
                    <br />
                    <span className="text-text-primary font-semibold">Success Rate:</span> {Math.round((historyAnalytics.successRate ?? 0) * 100)}%
                  </div>
                </div>

                {/* Accessible Status Announcement (TASK-056) */}
                <div aria-live="polite" className="text-[10px]">
                  {isExporting && (
                    <span className="text-accent flex items-center space-x-1">
                      <Loader2 size={12} className="animate-spin text-accent" />
                      <span>Generating local export...</span>
                    </span>
                  )}
                  {exportStatusMessage && !isExporting && (
                    <span className={`px-2 py-0.5 rounded border inline-block ${
                      exportStatusMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}>
                      {exportStatusMessage.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {historyActiveTab === 'analytics' && !historyAnalytics && (
            <div className="text-center py-8 text-text-secondary text-[11px] space-y-2">
              <Activity size={24} className="mx-auto opacity-20" />
              <p>No analytics data available yet</p>
            </div>
          )}

          {/* TASK-058: System Health Panel */}
          {historyActiveTab === 'health' && (
            <div className="p-4 space-y-4 font-sans text-xs">
              {/* Header with Overall Health Status Badge & Manual Refresh */}
              <div className="flex items-center justify-between p-3 bg-hover/40 border border-border rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase flex items-center space-x-1.5 ${
                    systemHealth?.overallStatus === 'HEALTHY'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : systemHealth?.overallStatus === 'DEGRADED'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : systemHealth?.overallStatus === 'UNAVAILABLE'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/40'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      systemHealth?.overallStatus === 'HEALTHY'
                        ? 'bg-emerald-400 animate-pulse'
                        : systemHealth?.overallStatus === 'DEGRADED'
                        ? 'bg-amber-400'
                        : systemHealth?.overallStatus === 'UNAVAILABLE'
                        ? 'bg-red-400'
                        : 'bg-zinc-400'
                    }`} />
                    <span>{systemHealth?.overallStatus ?? 'UNKNOWN'}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    {systemHealth?.overallReason ?? 'Checking system health status...'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {systemHealth?.generatedAt && (
                    <span className="text-[10px] font-mono text-text-secondary">
                      Updated {new Date(systemHealth.generatedAt).toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={() => fetchSystemHealth(true)}
                    disabled={isRefreshingHealth}
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-40 font-mono text-[11px]"
                    aria-label="Refresh System Health"
                  >
                    <RotateCcw size={12} className={isRefreshingHealth ? 'animate-spin' : ''} />
                    <span>{isRefreshingHealth ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {/* Summary Counts Bar */}
              {systemHealth?.summary && (
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="p-2 bg-hover/30 border border-border rounded-lg">
                    <div className="text-[10px] text-text-secondary">Total</div>
                    <div className="text-sm font-bold text-text-primary">{systemHealth.summary.totalComponents}</div>
                  </div>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <div className="text-[10px] text-emerald-400 font-medium">Healthy</div>
                    <div className="text-sm font-bold text-emerald-300">{systemHealth.summary.healthyCount}</div>
                  </div>
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="text-[10px] text-amber-400 font-medium">Degraded</div>
                    <div className="text-sm font-bold text-amber-300">{systemHealth.summary.degradedCount}</div>
                  </div>
                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="text-[10px] text-red-400 font-medium">Unavailable</div>
                    <div className="text-sm font-bold text-red-300">{systemHealth.summary.unavailableCount}</div>
                  </div>
                  <div className="p-2 bg-zinc-500/10 border border-zinc-500/30 rounded-lg">
                    <div className="text-[10px] text-zinc-400 font-medium">Unknown</div>
                    <div className="text-sm font-bold text-zinc-300">{systemHealth.summary.unknownCount}</div>
                  </div>
                </div>
              )}

              {/* Component Health Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {systemHealth?.components.map((comp: any) => {
                  const isExpanded = expandedComponentId === comp.componentId;
                  return (
                    <div
                      key={comp.componentId}
                      onClick={() => setExpandedComponentId(isExpanded ? null : comp.componentId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedComponentId(isExpanded ? null : comp.componentId);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-expanded={isExpanded}
                      aria-label={`Component ${comp.componentName} status ${comp.status}`}
                      className="p-3 bg-hover/30 border border-border hover:border-accent/40 rounded-xl transition-all cursor-pointer space-y-2 focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-semibold text-text-primary">
                          <Activity size={13} className="text-accent" />
                          <span>{comp.componentName}</span>
                          {comp.isCritical && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-500/20 rounded">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          comp.status === 'HEALTHY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : comp.status === 'DEGRADED'
                            ? 'bg-amber-500/20 text-amber-300'
                            : comp.status === 'UNAVAILABLE'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-zinc-500/20 text-zinc-300'
                        }`}>
                          {comp.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-text-secondary leading-snug">
                        {comp.statusReason}
                      </div>

                      {/* Expandable Detail Metrics */}
                      {isExpanded && comp.metrics && (
                        <div className="pt-2 border-t border-border/50 font-mono text-[10px] space-y-1 bg-hover/50 p-2 rounded-lg">
                          <div className="text-accent font-semibold">Operational Metrics</div>
                          {Object.entries(comp.metrics).map(([k, v]) => (
                            <div key={k} className="flex justify-between text-text-secondary">
                              <span>{k}:</span>
                              <span className="text-text-primary font-bold">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Accessible Live Announcement */}
              <div aria-live="polite" className="sr-only">
                System health updated. Overall status: {systemHealth?.overallStatus ?? 'UNKNOWN'}.
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Composer & Prompt Control Bar */}
      <Card className="p-3 bg-card-bg/60 border border-border rounded-xl space-y-2 backdrop-blur-md shadow-sm">
        {/* Context Status Bar */}
        <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary px-1">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Real Token Streaming Active • Empirical Context Attached</span>
          </span>
          <span>Press Enter to send • Shift+Enter for newline</span>
        </div>

        {/* Input Textarea & Action Controls */}
        <div className="flex items-end space-x-3">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask CodeMemory X AI Assistant about your codebase memories, symbols, decisions, or architectural drift..."
            rows={2}
            className="flex-1 bg-hover/50 border border-border rounded-lg p-2.5 text-xs text-text-primary outline-none focus:border-accent transition-colors resize-none font-sans"
          />

          <div className="flex items-center space-x-2 pb-0.5">
            {isGenerating ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleStop}
                className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 space-x-1.5"
              >
                <Square size={14} />
                <span>Stop</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSend()}
                disabled={!inputPrompt.trim()}
                className="space-x-1.5"
              >
                <Send size={14} />
                <span>Send</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Clear Conversation Confirmation Modal */}
      {showClearModal && (
        <Modal
          isOpen={showClearModal}
          title="Clear Conversation History"
          onClose={() => setShowClearModal(false)}
        >
          <div className="space-y-4 text-xs font-sans">
            <p className="text-text-secondary">
              Are you sure you want to clear all conversation messages for this session? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowClearModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmClear}>
                Clear Conversation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
