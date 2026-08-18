import React from 'react';
import { SymbolStoryData } from './mockSymbolStory.js';
import { Activity, ShieldAlert, CheckCircle, Flame, Layers } from 'lucide-react';

export const StoryMetrics: React.FC<{ metrics: SymbolStoryData['metrics'] }> = ({ metrics }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-zinc-200">
        <Activity className="w-4 h-4 text-cyan-500" />
        <span>Cognitive Symbol Metrics</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-3 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-gray-400 dark:text-zinc-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Complexity</span>
            <Layers className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-base font-extrabold font-mono text-gray-900 dark:text-zinc-100">
            {Math.round(metrics.complexityScore * 100)}%
          </p>
        </div>

        <div className="p-3 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-gray-400 dark:text-zinc-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Changes</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-base font-extrabold font-mono text-gray-900 dark:text-zinc-100">
            {metrics.totalChanges} Commits
          </p>
        </div>

        <div className="p-3 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-gray-400 dark:text-zinc-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Risk Index</span>
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {Math.round(metrics.riskScore * 100)}% (Low)
          </p>
        </div>

        <div className="p-3 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md space-y-1">
          <div className="flex items-center justify-between text-gray-400 dark:text-zinc-500">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Confidence</span>
            <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
            {Math.round(metrics.confidenceScore * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
};
