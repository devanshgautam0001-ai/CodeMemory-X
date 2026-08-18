import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  showFilters,
  onToggleFilters,
}) => {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1 flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search memories, symbols, decisions..."
          className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-2.5 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <button
        onClick={onToggleFilters}
        className={`p-2 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
          showFilters
            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
            : 'border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700'
        }`}
        title="Toggle Filter Options"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
