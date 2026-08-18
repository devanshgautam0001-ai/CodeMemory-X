import React from 'react';
import { motion } from 'framer-motion';
import { TimelineEventItem } from './mockTimeline.js';
import {
  FilePlus,
  FileCode,
  Code2,
  GitCommit,
  Bug,
  GitPullRequest,
  PackagePlus,
  Play,
  Square,
  Sparkles,
  Flag,
  ChevronRight,
} from 'lucide-react';

const EVENT_TYPE_MAP: Record<string, { icon: React.ElementType; style: string }> = {
  'File Created': { icon: FilePlus, style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  'File Modified': { icon: FileCode, style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  'Symbol Added': { icon: Code2, style: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  'Symbol Renamed': { icon: Code2, style: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  Refactor: { icon: GitPullRequest, style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  'ADR Recorded': { icon: GitCommit, style: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  'Bug Fixed': { icon: Bug, style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  'Dependency Added': { icon: PackagePlus, style: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
  'Session Started': { icon: Play, style: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
  'Session Ended': { icon: Square, style: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
  Release: { icon: Sparkles, style: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
  Milestone: { icon: Flag, style: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
};

export interface TimelineCardProps {
  event: TimelineEventItem;
  isSelected?: boolean;
  onSelect: (event: TimelineEventItem) => void;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({ event, isSelected, onSelect }) => {
  const cfg = EVENT_TYPE_MAP[event.type] || EVENT_TYPE_MAP['File Modified'];
  const Icon = cfg.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(event)}
      className={`group relative p-3 rounded-2xl border backdrop-blur-md cursor-pointer transition-all ${
        isSelected
          ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-500 shadow-md shadow-purple-500/10'
          : 'bg-white/70 dark:bg-zinc-900/70 border-gray-200/80 dark:border-zinc-800/80 shadow-sm hover:border-purple-500/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-xl border ${cfg.style}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {event.title}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">{event.timestamp}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed mb-2 line-clamp-2">
        {event.description}
      </p>

      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-400 pt-2 border-t border-gray-100 dark:border-zinc-800/60 font-mono">
        <div className="flex items-center gap-2">
          <span>by <strong className="text-gray-800 dark:text-zinc-200">{event.author}</strong></span>
          <span className="text-gray-300 dark:text-zinc-700">•</span>
          <span>Imp: <strong className="text-purple-600 dark:text-purple-400">{Math.round(event.importance * 100)}%</strong></span>
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {event.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
