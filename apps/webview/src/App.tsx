import React, { useEffect } from 'react';
import { Header, SearchBox, Button } from '@codememory/ui';
import { Command } from 'lucide-react';
import { NavigationRail } from './components/NavigationRail.js';
import { DashboardView } from './components/DashboardView.js';
import { MemoryTimelineView } from './components/MemoryTimelineView.js';
import { StoryView } from './components/StoryView.js';
import { KnowledgeGraphCard } from './components/KnowledgeGraphCard.js';
import { ActivityFeed } from './components/ActivityFeed.js';
import { SettingsView } from './components/SettingsView.js';
import { AssistantView } from './components/AssistantView.js';
import { CommandPaletteModal } from './components/CommandPaletteModal.js';
import { useDashboardStore } from './store/useDashboardStore.js';

import { rpcClient } from './rpc/WebviewRpcClient.js';

export const App: React.FC = () => {
  const {
    activeTab,
    searchQuery,
    setSearchQuery,
    setCommandPaletteOpen,
    setLiveState,
    theme,
  } = useDashboardStore();

  // Handle postMessage events from Extension Host & request initial state
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && msg.command === 'UPDATE_STATE' && msg.payload) {
        setLiveState(msg.payload);
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial pipeline snapshot from Extension Host via RPC
    rpcClient
      .sendRequest('REQUEST_SNAPSHOT')
      .then((snapshot) => {
        if (snapshot) setLiveState(snapshot);
      })
      .catch((err) => {
        console.warn('Initial snapshot request warning:', err);
      });

    return () => window.removeEventListener('message', handleMessage);
  }, [setLiveState]);

  // Keyboard shortcut handler (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'assistant':
        return <AssistantView />;
      case 'timeline':
        return <MemoryTimelineView />;
      case 'story':
        return <StoryView />;
      case 'graph':
        return <KnowledgeGraphCard />;
      case 'activity':
        return <ActivityFeed />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-background text-text-primary vscode-${theme}`}>
      {/* Navigation Rail */}
      <NavigationRail />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Header
          title="Memory Dashboard"
          subtitle="Cognitive Memory Layer for Software Engineering"
          actions={
            <div className="flex items-center space-x-3">
              <div className="w-64">
                <SearchBox value={searchQuery} onChange={setSearchQuery} />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCommandPaletteOpen(true)}
                className="space-x-1.5 font-mono text-xs"
              >
                <Command size={14} className="text-accent" />
                <span>Cmd+K</span>
              </Button>
            </div>
          }
        />

        {/* View Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </main>

        {/* Footer Bar */}
        <footer className="px-6 py-2 border-t border-border bg-sidebar-bg/60 backdrop-blur-md flex items-center justify-between text-[10px] font-mono text-text-secondary">
          <div className="flex items-center space-x-4">
            <span>CodeMemory X v0.1.0-alpha</span>
            <span>•</span>
            <span className="text-emerald-400">Live Vertical Slice Active</span>
          </div>
          <div className="flex items-center space-x-3">
            <span>Press <kbd className="px-1 py-0.5 bg-hover rounded border border-border">Cmd+K M</kbd> for Command Palette</span>
          </div>
        </footer>
      </div>

      {/* Raycast Style Command Palette Modal */}
      <CommandPaletteModal />
    </div>
  );
};

export default App;
