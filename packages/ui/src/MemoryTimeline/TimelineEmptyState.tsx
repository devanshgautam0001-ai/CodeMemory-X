import React from 'react';
import { History, Sparkles } from 'lucide-react';

export const TimelineEmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md my-auto">
      <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-3 animate-bounce">
        <History className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 justify-center">
        <span>No project timeline events found</span>
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
      </h3>
      <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
        Your project memories and cognitive timeline events will appear here as you develop. Try adjusting search or filter options.
      </p>
    </div>
  );
};
