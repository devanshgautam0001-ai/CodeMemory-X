import React from 'react';
import { GraphDataset } from './mockKnowledgeGraph.js';
import { Network, GitBranch, Share2, Flame, CircleOff } from 'lucide-react';

export const GraphStatistics: React.FC<{ stats: GraphDataset['stats'] }> = ({ stats }) => {
  const cards = [
    { label: 'Total Nodes', value: stats.totalNodes, icon: Network, color: 'text-indigo-500' },
    { label: 'Total Edges', value: stats.totalEdges, icon: GitBranch, color: 'text-purple-500' },
    { label: 'Avg Connections', value: stats.avgConnections, icon: Share2, color: 'text-cyan-500' },
    { label: 'Hotspots', value: stats.hotspots, icon: Flame, color: 'text-amber-500' },
    { label: 'Isolated Nodes', value: stats.isolatedNodes, icon: CircleOff, color: 'text-emerald-500' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className="p-2.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center gap-2 shadow-sm"
          >
            <Icon className={`w-4 h-4 ${c.color}`} />
            <div>
              <p className="text-[9px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider">
                {c.label}
              </p>
              <p className="text-xs font-extrabold font-mono text-gray-900 dark:text-zinc-100">
                {c.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
