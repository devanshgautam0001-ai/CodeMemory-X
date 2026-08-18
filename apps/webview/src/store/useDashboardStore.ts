import { create } from 'zustand';

export type NavTab = 'dashboard' | 'timeline' | 'story' | 'graph' | 'activity' | 'assistant' | 'settings';

export interface AssistantMessageItem {
  id: string;
  requestId?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: string;
  toolCallsExecuted?: any[];
  error?: string;
  isStreaming?: boolean;
}

interface DashboardState {
  activeTab: NavTab;
  searchQuery: string;
  isCommandPaletteOpen: boolean;
  theme: 'dark' | 'light' | 'high-contrast';
  memories: any[];
  timelineData: any | null;
  symbolStory: any | null;
  knowledgeGraph: any | null;
  driftFindings: any[];
  changeImpact: any | null;
  sessionIntelligence: any | null;

  // AI Assistant State
  assistantMessages: AssistantMessageItem[];
  conversationsList: any[];
  activeConversationId: string;
  isGenerating: boolean;
  currentRequestId: string | null;
  lastContextUsed: any | null;
  selectedProvider: string;
  selectedModel: string;
  enableTools: boolean;

  // TASK-054/055: Bounded Analytics Visualization & Interactive Drill-Down State
  visualizationData: any | null;
  visualizationLoading: boolean;
  visualizationError: string | null;
  activeVisualizationRequestId: string | null;
  selectedBucketIndex: number | null;

  setActiveTab: (tab: NavTab) => void;
  setSearchQuery: (query: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'high-contrast') => void;
  setLiveState: (data: {
    memories?: any[];
    timelineData?: any;
    symbolStory?: any;
    knowledgeGraph?: any;
    driftFindings?: any[];
    changeImpact?: any;
    sessionIntelligence?: any;
  }) => void;

  addAssistantMessage: (msg: AssistantMessageItem) => void;
  updateStreamingMessage: (
    requestId: string,
    chunk: { conversationId?: string; contentDelta?: string; fullContent?: string; isComplete?: boolean; contextUsed?: any; error?: string }
  ) => void;
  setAssistantMessages: (messages: AssistantMessageItem[]) => void;
  setConversationsList: (list: any[]) => void;
  setActiveConversationId: (id: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setCurrentRequestId: (id: string | null) => void;
  setLastContextUsed: (ctx: any) => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  setEnableTools: (enable: boolean) => void;
  clearConversationState: () => void;
  setVisualizationData: (data: any, requestId: string) => void;
  setVisualizationLoading: (loading: boolean, requestId: string) => void;
  setVisualizationError: (error: string | null, requestId: string) => void;
  clearVisualizationState: () => void;
  setSelectedBucketIndex: (index: number | null) => void;
  clearSelectedBucket: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeTab: 'dashboard',
  searchQuery: '',
  isCommandPaletteOpen: false,
  theme: 'dark',
  memories: [],
  timelineData: null,
  symbolStory: null,
  knowledgeGraph: null,
  driftFindings: [],
  changeImpact: null,
  sessionIntelligence: null,

  // AI Assistant State Defaults
  assistantMessages: [
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: 'Hello! I am your CodeMemory X AI Coding Assistant. I have full access to your workspace memories, symbol stories, developer sessions, ADR decisions, architectural drift sentinel warnings, and structural change impact. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ],
  conversationsList: [],
  activeConversationId: 'conv_default',
  isGenerating: false,
  currentRequestId: null,
  lastContextUsed: null,
  selectedProvider: 'ollama',
  selectedModel: 'llama3',
  enableTools: true,

  // TASK-054/055: Visualization State Defaults
  visualizationData: null,
  visualizationLoading: false,
  visualizationError: null,
  activeVisualizationRequestId: null,
  selectedBucketIndex: null,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setCommandPaletteOpen: (isCommandPaletteOpen) => set({ isCommandPaletteOpen }),
  setTheme: (theme) => set({ theme }),
  setLiveState: (data) =>
    set((state) => ({
      memories: data.memories ?? state.memories,
      timelineData: data.timelineData ?? state.timelineData,
      symbolStory: data.symbolStory ?? state.symbolStory,
      knowledgeGraph: data.knowledgeGraph ?? state.knowledgeGraph,
      driftFindings: data.driftFindings ?? state.driftFindings,
      changeImpact: data.changeImpact ?? state.changeImpact,
      sessionIntelligence: data.sessionIntelligence ?? state.sessionIntelligence,
    })),

  addAssistantMessage: (msg) =>
    set((state) => {
      const next = [...state.assistantMessages, msg];
      if (next.length > 1000) {
        next.shift();
      }
      return { assistantMessages: next };
    }),

  updateStreamingMessage: (requestId, chunk) =>
    set((state) => {
      if (state.currentRequestId && requestId !== state.currentRequestId) {
        return state;
      }
      if (chunk.conversationId && state.activeConversationId && chunk.conversationId !== state.activeConversationId) {
        return state;
      }

      const msgIndex = state.assistantMessages.findIndex((m) => m.requestId === requestId);
      if (msgIndex === -1) {
        // Create new placeholder message if not present
        const newMsg: AssistantMessageItem = {
          id: `msg_ast_${requestId}`,
          requestId,
          role: 'assistant',
          content: chunk.fullContent ?? chunk.contentDelta ?? '',
          timestamp: new Date().toISOString(),
          isStreaming: !chunk.isComplete,
          error: chunk.error,
        };
        return {
          assistantMessages: [...state.assistantMessages, newMsg],
          lastContextUsed: chunk.contextUsed ?? state.lastContextUsed,
        };
      }

      const existing = state.assistantMessages[msgIndex];
      const updatedContent = chunk.fullContent ?? (existing.content + (chunk.contentDelta ?? ''));
      const updatedMessages = [...state.assistantMessages];
      updatedMessages[msgIndex] = {
        ...existing,
        content: updatedContent,
        isStreaming: !chunk.isComplete,
        error: chunk.error ?? existing.error,
      };

      return {
        assistantMessages: updatedMessages,
        lastContextUsed: chunk.contextUsed ?? state.lastContextUsed,
      };
    }),

  setAssistantMessages: (assistantMessages) => set({ assistantMessages }),
  setConversationsList: (conversationsList) => set({ conversationsList }),
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setCurrentRequestId: (currentRequestId) => set({ currentRequestId }),
  setLastContextUsed: (lastContextUsed) => set({ lastContextUsed }),
  setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setEnableTools: (enableTools) => set({ enableTools }),
  clearConversationState: () =>
    set({
      assistantMessages: [
        {
          id: `msg_welcome_${Date.now()}`,
          role: 'assistant',
          content: 'Conversation cleared. How can I assist you with your codebase?',
          timestamp: new Date().toISOString(),
        },
      ],
      lastContextUsed: null,
      visualizationData: null,
      visualizationError: null,
      activeVisualizationRequestId: null,
      selectedBucketIndex: null,
    }),

  setVisualizationData: (visualizationData, requestId) =>
    set((state) => {
      if (state.activeVisualizationRequestId && requestId !== state.activeVisualizationRequestId) {
        return state; // Discard stale RPC response
      }
      return { visualizationData, visualizationLoading: false, visualizationError: null, selectedBucketIndex: null };
    }),

  setVisualizationLoading: (visualizationLoading, requestId) =>
    set({ visualizationLoading, activeVisualizationRequestId: requestId, visualizationError: null, selectedBucketIndex: null }),

  setVisualizationError: (visualizationError, requestId) =>
    set((state) => {
      if (state.activeVisualizationRequestId && requestId !== state.activeVisualizationRequestId) {
        return state; // Discard stale RPC response
      }
      return { visualizationError, visualizationLoading: false, selectedBucketIndex: null };
    }),

  clearVisualizationState: () =>
    set({ visualizationData: null, visualizationLoading: false, visualizationError: null, activeVisualizationRequestId: null, selectedBucketIndex: null }),

  setSelectedBucketIndex: (selectedBucketIndex) => set({ selectedBucketIndex }),

  clearSelectedBucket: () => set({ selectedBucketIndex: null }),
}));
