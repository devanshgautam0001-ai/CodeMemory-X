import React from 'react';
import { History, GitBranch, Clock, Sparkles, SlidersHorizontal, FolderGit2 } from 'lucide-react';

export interface TimelineHeaderProps {
  projectName: string;
  workspace: string;
  sessionDuration: string;
  currentBranch: string;
  totalMemories: number;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  projectName,
  workspace,
  sessionDuration,
  currentBranch,
  totalMemories,
  showFilters,
  onToggleFilters,
}) => {
  return (
    <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-gray-900 dark:text-zinc-100">
                {projectName}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Cognitive Timeline
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5 font-mono truncate">
              <FolderGit2 className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate">{workspace}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onToggleFilters}
          className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 font-medium ${
            showFilters
              ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-zinc-800/80 text-xs text-gray-600 dark:text-zinc-400 font-mono">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-800 dark:text-zinc-200 border border-gray-200/60 dark:border-zinc-700/60">
          <GitBranch className="w-3.5 h-3.5 text-purple-500" />
          <span>{currentBranch}</span>
        </span>

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-800 dark:text-zinc-200 border border-gray-200/60 dark:border-zinc-700/60">
          <Clock className="w-3.5 h-3.5 text-cyan-500" />
          <span>Active: {sessionDuration}</span>
        </span>

        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-semibold ml-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{totalMemories} Memories</span>
        </span>
      </div>
    </div>
  );
};
