import React from 'react';
import { Sparkles, Bot } from 'lucide-react';

export const StoryAiPlaceholder: React.FC = () => {
  return (
    <div className="relative p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl overflow-hidden shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-purple-500/20 animate-pulse">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>AI Impact & Evolutionary Prediction</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">
              Predictive refactoring risk & cognitive debt forecaster
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30">
          Coming Soon
        </span>
      </div>
    </div>
  );
};
