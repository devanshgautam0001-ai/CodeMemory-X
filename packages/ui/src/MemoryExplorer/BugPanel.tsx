import React from 'react';
import { MemoryItem } from './mockMemories.js';
import { Bug, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const BugPanel: React.FC<{ details: NonNullable<MemoryItem['details']> }> = ({ details }) => {
  const isResolved = details.status === 'resolved';

  return (
    <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-md space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-300">
          <Bug className="w-4 h-4" />
          <span>Bug Tracking Memory</span>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
            isResolved
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {details.status || 'open'}
        </span>
      </div>

      {details.bugDescription && (
        <p className="text-gray-700 dark:text-zinc-300 leading-relaxed bg-white/50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-rose-500/10">
          {details.bugDescription}
        </p>
      )}

      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 pt-1">
        <span className="flex items-center gap-1">
          <AlertOctagon className="w-3 h-3 text-rose-500" /> Severity: <strong className="uppercase font-mono text-rose-600 dark:text-rose-400">{details.severity}</strong>
        </span>
        {isResolved && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        )}
      </div>
    </div>
  );
};
