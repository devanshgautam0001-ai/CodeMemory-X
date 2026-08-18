import React from 'react';
import { MemoryItem } from './mockMemories.js';
import { GitPullRequest, Layers, FileCode } from 'lucide-react';

export const RefactorPanel: React.FC<{ details: NonNullable<MemoryItem['details']> }> = ({ details }) => {
  return (
    <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-md space-y-2 text-xs">
      <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
        <GitPullRequest className="w-4 h-4" />
        <span>Refactor: {details.refactorScope}</span>
      </div>

      {details.rationale && (
        <p className="text-gray-700 dark:text-zinc-300 leading-relaxed bg-white/50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-amber-500/10">
          {details.rationale}
        </p>
      )}

      {details.affectedFiles && details.affectedFiles.length > 0 && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 dark:text-zinc-400">
            <Layers className="w-3 h-3" />
            <span>Affected Files ({details.affectedFiles.length})</span>
          </div>
          <div className="space-y-1">
            {details.affectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/60 dark:bg-zinc-900/60 font-mono text-[10px] text-gray-700 dark:text-zinc-300 border border-amber-500/10 truncate"
              >
                <FileCode className="w-3 h-3 text-amber-500 flex-shrink-0" />
                <span className="truncate">{file}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
