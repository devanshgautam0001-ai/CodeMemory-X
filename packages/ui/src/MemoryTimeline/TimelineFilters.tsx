import React from 'react';
import { motion } from 'framer-motion';

export interface TimelineFiltersProps {
  activeType: string;
  onSelectType: (type: string) => void;
  activeAuthor: string;
  onSelectAuthor: (author: string) => void;
  minImportance: number;
  onMinImportanceChange: (val: number) => void;
}

const EVENT_TYPES = [
  'All',
  'ADR Recorded',
  'Bug Fixed',
  'Refactor',
  'File Modified',
  'Symbol Added',
  'Milestone',
];

const AUTHORS = ['All', 'Devan', 'Antigravity'];

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  activeType,
  onSelectType,
  activeAuthor,
  onSelectAuthor,
  minImportance,
  onMinImportanceChange,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md space-y-3 shadow-inner text-xs"
    >
      <div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500 block mb-1.5">
          Event Category
        </span>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((type) => {
            const isSelected = activeType === type;
            return (
              <button
                key={type}
                onClick={() => onSelectType(type)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/30'
                    : 'bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500 block mb-1">
            Author Filter
          </span>
          <div className="flex gap-1.5">
            {AUTHORS.map((author) => (
              <button
                key={author}
                onClick={() => onSelectAuthor(author)}
                className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all ${
                  activeAuthor === author
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                }`}
              >
                {author}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-600 dark:text-zinc-400 mb-1">
            <span>Min Importance:</span>
            <span className="font-mono text-gray-800 dark:text-zinc-200">{Math.round(minImportance * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={minImportance}
            onChange={(e) => onMinImportanceChange(parseFloat(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>
      </div>
    </motion.div>
  );
};
