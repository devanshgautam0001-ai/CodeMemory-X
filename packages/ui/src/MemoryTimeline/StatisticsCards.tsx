import React from 'react';
import { TimelineData } from './mockTimeline.js';
import { Sparkles, Clock, RefreshCw, GitCommit, Bug, Code2 } from 'lucide-react';

export const StatisticsCards: React.FC<{ stats: TimelineData['stats'] }> = ({ stats }) => {
  const cards = [
    { label: 'Memories Created', value: stats.memoriesCreated, icon: Sparkles, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { label: 'Sessions', value: stats.sessions, icon: Clock, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Refactors', value: stats.refactors, icon: RefreshCw, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { label: 'ADRs', value: stats.adrs, icon: GitCommit, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Bugs Fixed', value: stats.bugsFixed, icon: Bug, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
    { label: 'Symbols', value: stats.symbolsTracked, icon: Code2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="p-2.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md flex items-center gap-2.5 shadow-sm"
          >
            <div className={`p-1.5 rounded-xl border ${c.color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider truncate">
                {c.label}
              </p>
              <p className="text-sm font-extrabold font-mono text-gray-900 dark:text-zinc-100">
                {c.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
