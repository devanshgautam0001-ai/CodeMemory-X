import React from 'react';
import { motion } from 'framer-motion';
import { MemoryItem } from './mockMemories.js';
import {
  FileCode,
  Code2,
  GitCommit,
  Bug,
  GitPullRequest,
  Sparkles,
  Clock,
  ChevronRight,
} from 'lucide-react';

export interface MemoryCardProps {
  item: MemoryItem;
  isSelected: boolean;
  onSelect: (item: MemoryItem) => void;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  file: FileCode,
  symbol: Code2,
  decision: GitCommit,
  bug: Bug,
  refactor: GitPullRequest,
  intent: Sparkles,
  session: Clock,
};

const TYPE_STYLES: Record<string, { badge: string; border: string }> = {
  decision: {
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    border: 'hover:border-purple-500/40',
  },
  file: {
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'hover:border-blue-500/40',
  },
  bug: {
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    border: 'hover:border-rose-500/40',
  },
  symbol: {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'hover:border-emerald-500/40',
  },
  refactor: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'hover:border-amber-500/40',
  },
  intent: {
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    border: 'hover:border-indigo-500/40',
  },
  session: {
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    border: 'hover:border-cyan-500/40',
  },
};

export const MemoryCard: React.FC<MemoryCardProps> = ({ item, isSelected, onSelect }) => {
  const Icon = TYPE_ICONS[item.type] || FileCode;
  const style = TYPE_STYLES[item.type] || TYPE_STYLES.file;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(item)}
      className={`group relative p-3 rounded-xl border backdrop-blur-md cursor-pointer transition-all ${
        isSelected
          ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-500/10'
          : `bg-white/70 dark:bg-zinc-900/70 border-gray-200/80 dark:border-zinc-800/80 shadow-sm ${style.border}`
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg border ${style.badge}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {item.title}
          </h4>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
      </div>

      <p className="text-[11px] text-gray-600 dark:text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
        {item.summary}
      </p>

      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-500 pt-2 border-t border-gray-100 dark:border-zinc-800/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            Conf: <span className="text-gray-700 dark:text-zinc-300 font-mono">{Math.round(item.confidence * 100)}%</span>
          </span>
          <span className="flex items-center gap-1 font-medium">
            Imp: <span className="text-gray-700 dark:text-zinc-300 font-mono">{Math.round(item.importance * 100)}%</span>
          </span>
        </div>
        <span className="font-mono text-gray-400 dark:text-zinc-500">{item.recency}</span>
      </div>
    </motion.div>
  );
};
