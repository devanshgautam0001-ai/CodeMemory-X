import React from 'react';
import { SymbolStoryData } from './mockSymbolStory.js';
import { GitCommit, Calendar, User } from 'lucide-react';

export const StoryDecisions: React.FC<{ decisions: SymbolStoryData['decisions'] }> = ({ decisions }) => {
  if (decisions.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-zinc-200">
        <GitCommit className="w-4 h-4 text-purple-500" />
        <span>Architectural Decisions ({decisions.length})</span>
      </div>

      <div className="space-y-2">
        {decisions.map((d) => (
          <div
            key={d.id}
            className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-md space-y-1 text-xs shadow-sm"
          >
            <div className="flex items-center justify-between font-bold text-purple-700 dark:text-purple-300">
              <span>{d.title}</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-gray-400 font-normal">
                <Calendar className="w-3 h-3" /> {d.date}
              </span>
            </div>
            <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">{d.rationale}</p>
            <div className="text-[10px] text-gray-500 dark:text-zinc-400 flex items-center gap-1 pt-1 font-mono">
              <User className="w-3 h-3 text-purple-400" /> Decision by {d.author}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
