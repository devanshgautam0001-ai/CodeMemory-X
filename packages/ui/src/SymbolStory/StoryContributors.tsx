import React from 'react';
import { SymbolStoryData } from './mockSymbolStory.js';
import { Users } from 'lucide-react';

export const StoryContributors: React.FC<{ contributors: SymbolStoryData['contributors'] }> = ({ contributors }) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-zinc-200">
        <Users className="w-4 h-4 text-emerald-500" />
        <span>Authors & Contributors</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {contributors.map((c, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md flex items-center gap-3 shadow-sm"
          >
            <img
              src={c.avatar}
              alt={c.name}
              className="w-8 h-8 rounded-full object-cover border border-emerald-500/30 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-gray-900 dark:text-zinc-100 truncate">{c.name}</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{c.contributionPercentage}%</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${c.contributionPercentage}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 mt-1 block">
                Last edit: {c.lastEdit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
