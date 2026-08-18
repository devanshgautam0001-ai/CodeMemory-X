import React from 'react';

const LEGEND_ITEMS = [
  { label: 'Class', color: 'bg-purple-500' },
  { label: 'File', color: 'bg-blue-500' },
  { label: 'Package', color: 'bg-teal-500' },
  { label: 'ADR', color: 'bg-purple-600' },
  { label: 'Bug', color: 'bg-rose-500' },
  { label: 'Refactor', color: 'bg-amber-500' },
  { label: 'Session', color: 'bg-cyan-500' },
  { label: 'Developer', color: 'bg-pink-500' },
];

export const GraphLegend: React.FC = () => {
  return (
    <div className="p-2.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-md text-xs space-y-1.5">
      <span className="text-[10px] font-mono font-semibold uppercase text-gray-400 dark:text-zinc-500 block">
        Node Legend
      </span>
      <div className="grid grid-cols-2 gap-[5px]">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-zinc-300">
            <span className={`w-2 h-2 rounded-full ${item.color}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
