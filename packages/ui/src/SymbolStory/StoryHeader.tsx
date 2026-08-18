import React from 'react';
import { SymbolStoryData } from './mockSymbolStory.js';
import { Code2, FileCode, MapPin } from 'lucide-react';

export const StoryHeader: React.FC<{ symbol: SymbolStoryData['symbol'] }> = ({ symbol }) => {
  return (
    <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl shadow-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold tracking-tight text-gray-900 dark:text-zinc-100">
                {symbol.name}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {symbol.kind}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
              <FileCode className="w-3.5 h-3.5 text-gray-400" />
              <span>{symbol.filePath}</span>
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700">
          <MapPin className="w-3 h-3 text-indigo-500" />
          {symbol.lineRange}
        </span>
      </div>
    </div>
  );
};
