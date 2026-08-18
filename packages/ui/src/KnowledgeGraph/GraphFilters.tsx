import React from 'react';
import { motion } from 'framer-motion';

export interface GraphFiltersProps {
  activeType: string;
  onSelectType: (type: string) => void;
  layoutMode: string;
  onChangeLayoutMode: (mode: string) => void;
}

const CATEGORIES = ['All', 'Class', 'Package', 'ADR', 'Bug', 'Refactor', 'Session', 'Developer'];
const LAYOUT_MODES = [
  { id: 'force', label: 'Force Directed' },
  { id: 'hierarchical', label: 'Hierarchical' },
  { id: 'circular', label: 'Circular' },
  { id: 'dependency', label: 'Dependency' },
];

export const GraphFilters: React.FC<GraphFiltersProps> = ({
  activeType,
  onSelectType,
  layoutMode,
  onChangeLayoutMode,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md space-y-3 shadow-lg text-xs"
    >
      <div>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500 block mb-1.5">
          Node Filter Category
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = activeType === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectType(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500 block mb-1.5">
          Layout Mode
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {LAYOUT_MODES.map((l) => (
            <button
              key={l.id}
              onClick={() => onChangeLayoutMode(l.id)}
              className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-all text-center ${
                layoutMode === l.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
