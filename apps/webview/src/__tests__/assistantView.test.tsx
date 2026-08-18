import { describe, it, expect } from 'vitest';
import { useDashboardStore } from '../store/useDashboardStore.js';

describe('Webview AI Assistant View Integration Unit Tests', () => {
  it('manages assistant messages, provider selection, and tools toggle in store', () => {
    const store = useDashboardStore.getState();
    expect(store.assistantMessages.length).toBeGreaterThan(0);
    expect(store.selectedProvider).toBe('ollama');

    store.setSelectedProvider('claude');
    store.setSelectedModel('claude-3-5-sonnet');
    store.setEnableTools(false);

    expect(useDashboardStore.getState().selectedProvider).toBe('claude');
    expect(useDashboardStore.getState().selectedModel).toBe('claude-3-5-sonnet');
    expect(useDashboardStore.getState().enableTools).toBe(false);
  });

  it('adds user and assistant messages to state cleanly', () => {
    const store = useDashboardStore.getState();
    store.addAssistantMessage({
      id: 'msg_test_1',
      role: 'user',
      content: 'Explain SymbolGraph',
      timestamp: new Date().toISOString(),
    });

    const updated = useDashboardStore.getState().assistantMessages;
    const lastMsg = updated[updated.length - 1];
    expect(lastMsg.content).toBe('Explain SymbolGraph');
  });
});
