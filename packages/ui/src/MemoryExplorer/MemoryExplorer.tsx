import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_MEMORIES, MemoryItem } from './mockMemories.js';
import { SearchBar } from './SearchBar.js';
import { MemoryFilters } from './MemoryFilters.js';
import { MemoryCard } from './MemoryCard.js';
import { MemoryDetailsPanel } from './MemoryDetailsPanel.js';
import { Brain, Sparkles, Inbox } from 'lucide-react';

export interface MemoryExplorerProps {
  initialMemories?: MemoryItem[];
}

export const MemoryExplorer: React.FC<MemoryExplorerProps> = ({
  initialMemories = MOCK_MEMORIES,
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [minImportance, setMinImportance] = useState(0.0);
  const [selectedItem, setSelectedItem] = useState<MemoryItem | null>(initialMemories[0] || null);

  const filteredMemories = useMemo(() => {
    return initialMemories.filter((mem) => {
      // Type Filter
      if (activeType !== 'all' && mem.type !== activeType) {
        return false;
      }
      // Importance Filter
      if (mem.importance < minImportance) {
        return false;
      }
      // Text Search Filter
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchTitle = mem.title.toLowerCase().includes(q);
        const matchSummary = mem.summary.toLowerCase().includes(q);
        const matchType = mem.type.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchType) {
          return false;
        }
      }
      return true;
    });
  }, [initialMemories, query, activeType, minImportance]);

  const handleSelectRelated = (targetId: string) => {
    const found = initialMemories.find((m) => m.id === targetId);
    if (found) {
      setSelectedItem(found);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 p-3 space-y-3 overflow-hidden font-sans select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-1 border-b border-gray-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-tight">CodeMemory X</h2>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">Memory Explorer</p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <Sparkles className="w-3 h-3" /> {filteredMemories.length} Memories
        </span>
      </div>

      {/* Search & Filters Controls */}
      <div className="space-y-2">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        <AnimatePresence>
          {showFilters && (
            <MemoryFilters
              activeType={activeType}
              onSelectType={setActiveType}
              minImportance={minImportance}
              onMinImportanceChange={setMinImportance}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main Split Body: Memory Card List + Details Panel */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar">
        {filteredMemories.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-zinc-500 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl my-auto">
            <Inbox className="w-8 h-8 mb-2 stroke-[1.5]" />
            <p className="text-xs font-medium text-gray-700 dark:text-zinc-300">No memories found</p>
            <p className="text-[11px] mt-0.5">Try adjusting your search query or type filters.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMemories.map((item) => (
              <MemoryCard
                key={item.id}
                item={item}
                isSelected={selectedItem?.id === item.id}
                onSelect={setSelectedItem}
              />
            ))}
          </div>
        )}

        {/* Selected Details Panel Drawer */}
        <AnimatePresence>
          {selectedItem && (
            <MemoryDetailsPanel
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onSelectRelated={handleSelectRelated}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
