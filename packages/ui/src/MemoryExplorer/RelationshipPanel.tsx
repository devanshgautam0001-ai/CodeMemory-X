import React from 'react';
import { MemoryItem } from './mockMemories.js';
import { Network, ArrowRight } from 'lucide-react';

export interface RelationshipPanelProps {
  relationships: MemoryItem['relationships'];
  onSelectRelated: (targetMemoryId: string) => void;
}

export const RelationshipPanel: React.FC<RelationshipPanelProps> = ({
  relationships,
  onSelectRelated,
}) => {
  if (!relationships || relationships.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-400 dark:text-zinc-500 bg-gray-50/50 dark:bg-zinc-900/40 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
        No registered relationships for this memory item.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">
        <Network className="w-3.5 h-3.5 text-indigo-500" />
        <span>Connected Relationships ({relationships.length})</span>
      </div>

      <div className="space-y-1.5">
        {relationships.map((rel, idx) => (
          <div
            key={idx}
            onClick={() => onSelectRelated(rel.targetMemoryId)}
            className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 hover:border-indigo-500/40 cursor-pointer transition-all text-xs group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider font-semibold rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {rel.type}
              </span>
              <span className="font-medium text-gray-900 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {rel.targetTitle}
              </span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
