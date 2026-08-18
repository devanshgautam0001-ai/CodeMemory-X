import React from 'react';
import { SymbolStoryData } from './mockSymbolStory.js';
import { Sparkles, GitCommit, Calendar } from 'lucide-react';

export const StoryBirth: React.FC<{ birth: SymbolStoryData['birth'] }> = ({ birth }) => {
  return (
    <div className="p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent backdrop-blur-xl space-y-2.5 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Birth Story</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 dark:text-zinc-400">
          <GitCommit className="w-3 h-3 text-purple-500" />
          <span>{birth.commitHash}</span>
        </div>
      </div>

      <p className="text-xs text-gray-800 dark:text-zinc-200 leading-relaxed font-medium bg-white/60 dark:bg-zinc-900/60 p-3 rounded-xl border border-indigo-500/10">
        "{birth.reason}"
      </p>

      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 pt-1">
        <div className="flex items-center gap-1.5">
          <img
            src={birth.authorAvatar}
            alt={birth.author}
            className="w-4 h-4 rounded-full object-cover border border-indigo-500/30"
          />
          <span>Created by <strong className="text-gray-900 dark:text-zinc-100">{birth.author}</strong></span>
        </div>
        <span className="flex items-center gap-1 font-mono text-[10px]">
          <Calendar className="w-3 h-3 text-gray-400" />
          {birth.date}
        </span>
      </div>
    </div>
  );
};
