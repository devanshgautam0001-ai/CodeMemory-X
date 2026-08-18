import React from 'react';
import { motion } from 'framer-motion';

export interface MemoryFiltersProps {
  activeType: string;
  onSelectType: (type: string) => void;
  minImportance: number;
  onMinImportanceChange: (val: number) => void;
}

const FILTER_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'decision', label: 'Decisions' },
  { id: 'file', label: 'Files' },
  { id: 'bug', label: 'Bugs' },
  { id: 'symbol', label: 'Symbols' },
  { id: 'refactor', label: 'Refactors' },
  { id: 'session', label: 'Sessions' },
];

export const MemoryFilters: React.FC<MemoryFiltersProps> = ({
  activeType,
  onSelectType,
  minImportance,
  onMinImportanceChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3 rounded-lg border border-gray-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md space-y-3 shadow-inner"
    >
      <div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500 block mb-1.5">
          Type Filter
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FILTER_TYPES.map((t) => {
            const isSelected = activeType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectType(t.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
        <span className="text-[11px] font-medium text-gray-600 dark:text-zinc-400">Min Importance:</span>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={minImportance}
            onChange={(e) => onMinImportanceChange(parseFloat(e.target.value))}
            className="w-24 accent-indigo-600 cursor-pointer"
          />
          <span className="text-[11px] font-mono text-gray-700 dark:text-zinc-300 w-6 text-right">
            {Math.round(minImportance * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};
