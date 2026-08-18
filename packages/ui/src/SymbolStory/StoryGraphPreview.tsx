import React, { useState } from 'react';
import { SymbolStoryData } from './mockSymbolStory.js';
import { Network, ArrowRight } from 'lucide-react';

export const StoryGraphPreview: React.FC<{ dependencies: SymbolStoryData['dependencies'] }> = ({ dependencies }) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-zinc-200">
          <Network className="w-4 h-4 text-indigo-500" />
          <span>Dependency Graph Preview</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">
          {dependencies.nodes.length} Nodes • {dependencies.edges.length} Edges
        </span>
      </div>

      <div className="p-4 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-inner space-y-3">
        {/* Node Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {dependencies.nodes.map((node) => {
            const isSelf = node.type === 'self';
            const isSelected = selectedNode === node.id;

            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  isSelf
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold scale-105'
                    : isSelected
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}
              >
                {node.name}
              </button>
            );
          })}
        </div>

        {/* Edge Connections */}
        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-1.5">
          {dependencies.edges.map((edge, idx) => {
            const fromNode = dependencies.nodes.find((n) => n.id === edge.from);
            const toNode = dependencies.nodes.find((n) => n.id === edge.to);

            return (
              <div
                key={idx}
                className="flex items-center justify-between text-[11px] font-mono p-2 rounded-lg bg-gray-50/80 dark:bg-zinc-950/50 border border-gray-100 dark:border-zinc-800/60"
              >
                <span className="font-semibold text-gray-800 dark:text-zinc-200">{fromNode?.name}</span>
                <div className="flex items-center gap-1 text-indigo-500 font-bold text-[10px]">
                  <ArrowRight className="w-3 h-3" />
                  <span>{edge.label}</span>
                </div>
                <span className="font-semibold text-gray-800 dark:text-zinc-200">{toNode?.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
