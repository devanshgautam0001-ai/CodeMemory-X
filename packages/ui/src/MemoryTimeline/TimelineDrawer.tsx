import React from 'react';
import { motion } from 'framer-motion';
import { TimelineEventItem } from './mockTimeline.js';
import { X, GitCommit, FileCode, Code2, Tag, Calendar, User, Zap } from 'lucide-react';

export interface TimelineDrawerProps {
  event: TimelineEventItem | null;
  onClose: () => void;
}

export const TimelineDrawer: React.FC<TimelineDrawerProps> = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      className="p-4 rounded-2xl border border-purple-500/30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl space-y-3"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
        <div>
          <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-1 inline-block">
            {event.type}
          </span>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">{event.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50/80 dark:bg-zinc-950/60 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 font-medium">
        {event.description}
      </p>

      {event.details?.rationale && (
        <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs space-y-1">
          <span className="font-bold text-purple-700 dark:text-purple-300 block">Decision Rationale</span>
          <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">{event.details.rationale}</p>
        </div>
      )}

      {event.details?.filesChanged && event.details.filesChanged.length > 0 && (
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5 text-blue-500" /> Files Changed:
          </span>
          <div className="space-y-1">
            {event.details.filesChanged.map((f, idx) => (
              <div key={idx} className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800/80 font-mono text-[10px] text-gray-800 dark:text-zinc-200">
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {event.details?.symbolsTouched && event.details.symbolsTouched.length > 0 && (
        <div className="space-y-1 text-xs">
          <span className="font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-emerald-500" /> Symbols Touched:
          </span>
          <div className="flex flex-wrap gap-1">
            {event.details.symbolsTouched.map((sym, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] border border-emerald-500/20">
                {sym}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-100 dark:border-zinc-800 font-mono">
        <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-purple-500" />
          <span>{event.author}</span>
        </div>
        <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-500" />
          <span>{event.timestamp}</span>
        </div>
      </div>
    </motion.div>
  );
};
