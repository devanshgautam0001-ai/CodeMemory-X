import React from 'react';
import { MemoryItem } from './mockMemories.js';
import { GitCommit, User, Tag } from 'lucide-react';

export const DecisionPanel: React.FC<{ details: NonNullable<MemoryItem['details']> }> = ({ details }) => {
  return (
    <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-md space-y-2 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-300">
        <GitCommit className="w-4 h-4" />
        <span>ADR: {details.decisionTitle}</span>
      </div>

      {details.rationale && (
        <p className="text-gray-700 dark:text-zinc-300 leading-relaxed bg-white/50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-purple-500/10">
          {details.rationale}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 pt-1">
        {details.author && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" /> Author: <strong className="text-gray-700 dark:text-zinc-200">{details.author}</strong>
          </span>
        )}
        {details.boundSymbols && details.boundSymbols.length > 0 && (
          <div className="flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Bound: {details.boundSymbols.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
