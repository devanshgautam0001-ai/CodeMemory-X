import React from 'react';
import { LayoutDashboard, Clock, BookOpen, Network, Activity, Settings, Brain, Sparkles } from 'lucide-react';
import { useDashboardStore, NavTab } from '../store/useDashboardStore.js';

export const NavigationRail: React.FC = () => {
  const { activeTab, setActiveTab } = useDashboardStore();

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Sparkles size={16} /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock size={16} /> },
    { id: 'story', label: 'Story Engine', icon: <BookOpen size={16} /> },
    { id: 'graph', label: 'Knowledge Graph', icon: <Network size={16} /> },
    { id: 'activity', label: 'Activity Feed', icon: <Activity size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="w-60 bg-sidebar-bg border-r border-border flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-border flex items-center space-x-3">
        <div className="p-2 bg-accent/20 rounded-lg text-accent border border-accent/30 shadow-xs">
          <Brain size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-primary tracking-wider uppercase">CodeMemory X</h2>
          <p className="text-[10px] text-text-secondary font-mono">Memory Layer v0.1.0-alpha</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-2 space-y-1 flex-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/30 font-semibold shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-hover'
              }`}
            >
              <span className={isActive ? 'text-accent' : 'text-text-secondary'}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Engine Pill */}
      <div className="p-3 border-t border-border bg-card-bg/30">
        <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WAL Active</span>
          </span>
          <span className="text-accent font-semibold">SQLite+DuckDB</span>
        </div>
      </div>
    </div>
  );
};
