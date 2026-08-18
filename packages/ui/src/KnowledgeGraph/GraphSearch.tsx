import React from 'react';
import { Search, X } from 'lucide-react';

export interface GraphSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
}

export const GraphSearch: React.FC<GraphSearchProps> = ({ query, onQueryChange }) => {
  return (
    <div className="relative flex items-center w-full max-w-sm">
      <Search className="absolute left-3 w-4 h-4 text-gray-400 dark:text-zinc-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search knowledge graph nodes..."
        className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-md"
      />
      {query && (
        <button
          onClick={() => onQueryChange('')}
          className="absolute right-2.5 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
