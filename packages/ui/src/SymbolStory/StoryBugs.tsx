import React from 'react';
import { SymbolStoryData } from './mockSymbolStory.js';
import { Bug, CheckCircle2 } from 'lucide-react';

export const StoryBugs: React.FC<{ bugs: SymbolStoryData['bugs'] }> = ({ bugs }) => {
  if (bugs.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-zinc-200">
        <Bug className="w-4 h-4 text-rose-500" />
        <span>Bug History ({bugs.length})</span>
      </div>

      <div className="space-y-2">
        {bugs.map((b) => (
          <div
            key={b.id}
            className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md space-y-1.5 text-xs shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[10px] font-mono">
                {b.severity} Severity
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Resolved ({b.resolvedAt})
              </span>
            </div>
            <p className="text-gray-800 dark:text-zinc-200 leading-relaxed font-medium">{b.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
