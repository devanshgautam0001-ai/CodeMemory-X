import React from 'react';
import { motion } from 'framer-motion';
import { SymbolStoryData } from './mockSymbolStory.js';
import { GitBranch, PlusCircle, ArrowRightLeft, Move, RefreshCw, AlertTriangle, RotateCcw } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  Added: { icon: PlusCircle, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  Renamed: { icon: ArrowRightLeft, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  Moved: { icon: Move, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  Refactored: { icon: RefreshCw, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  Deprecated: { icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  Restored: { icon: RotateCcw, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20' },
};

export const StoryTimeline: React.FC<{ evolution: SymbolStoryData['evolution'] }> = ({ evolution }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-zinc-200">
        <GitBranch className="w-4 h-4 text-purple-500" />
        <span>Evolution Timeline ({evolution.length} Milestones)</span>
      </div>

      <div className="relative pl-4 space-y-3 border-l-2 border-gray-200 dark:border-zinc-800">
        {evolution.map((item, idx) => {
          const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.Added;
          const Icon = cfg.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative p-3 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`absolute -left-[25px] top-3.5 p-1 rounded-full border ${cfg.color}`}>
                <Icon className="w-3 h-3" />
              </div>

              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded border ${cfg.color}`}>
                    {item.type}
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.author}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">{item.date}</span>
              </div>

              <p className="text-xs text-gray-600 dark:text-zinc-300 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
