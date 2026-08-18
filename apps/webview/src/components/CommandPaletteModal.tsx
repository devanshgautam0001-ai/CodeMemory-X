import React, { useState } from 'react';
import { Search, Brain, FileText, ShieldAlert, Sparkles, Command } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const CommandPaletteModal: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen, setActiveTab } = useDashboardStore();
  const [query, setQuery] = useState('');

  if (!isCommandPaletteOpen) return null;

  const commands = [
    { id: 'adr', label: 'Record Architectural Decision (ADR)', icon: <FileText size={16} />, tab: 'dashboard' },
    { id: 'story', label: 'Reconstruct Symbol Lineage Story', icon: <Sparkles size={16} />, tab: 'story' },
    { id: 'graph', label: 'Explore Knowledge Graph Topology', icon: <Brain size={16} />, tab: 'graph' },
    { id: 'risk', label: 'Run Architectural Sentinel Risk Scan', icon: <ShieldAlert size={16} />, tab: 'risk' },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="bg-card-bg border border-border rounded-xl shadow-2xl max-w-xl w-full overflow-hidden space-y-0 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border/60 bg-hover/20">
          <Search size={16} className="text-text-secondary mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search memory atoms..."
            className="w-full bg-transparent text-text-primary text-sm placeholder:text-text-secondary/50 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 bg-hover text-text-secondary text-[10px] font-mono rounded border border-border">
            ESC
          </kbd>
        </div>

        {/* Action Commands List */}
        <div className="p-2 max-h-72 overflow-y-auto space-y-1">
          {filtered.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => {
                setActiveTab(cmd.tab as any);
                setCommandPaletteOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/15 hover:text-accent text-text-primary transition-all text-left group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-text-secondary group-hover:text-accent">{cmd.icon}</span>
                <span className="font-medium">{cmd.label}</span>
              </div>
              <Command size={12} className="text-text-secondary opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
