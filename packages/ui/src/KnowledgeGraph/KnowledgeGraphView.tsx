import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_KNOWLEDGE_GRAPH, GraphDataset, GraphNodeData } from './mockKnowledgeGraph.js';
import { GraphCanvas } from './GraphCanvas.js';
import { GraphSearch } from './GraphSearch.js';
import { GraphFilters } from './GraphFilters.js';
import { GraphLegend } from './GraphLegend.js';
import { GraphStatistics } from './GraphStatistics.js';
import { MiniMap } from './MiniMap.js';
import { InspectorDrawer } from './InspectorDrawer.js';
import { Network, Sparkles, SlidersHorizontal } from 'lucide-react';

export interface KnowledgeGraphViewProps {
  dataset?: GraphDataset;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  dataset: rawDataset,
}) => {
  const dataset = rawDataset || MOCK_KNOWLEDGE_GRAPH;
  const safeNodes = dataset.nodes && dataset.nodes.length > 0 ? dataset.nodes : MOCK_KNOWLEDGE_GRAPH.nodes;
  const safeEdges = dataset.edges || MOCK_KNOWLEDGE_GRAPH.edges;
  const safeStats = dataset.stats || MOCK_KNOWLEDGE_GRAPH.stats;
  const safeDataset: GraphDataset = { ...dataset, nodes: safeNodes, edges: safeEdges, stats: safeStats };

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeType, setActiveType] = useState('All');
  const [layoutMode, setLayoutMode] = useState('force');
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(safeNodes[0] || null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 p-4 space-y-4 overflow-y-auto font-sans select-none custom-scrollbar"
    >
      {/* Hero Title Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight">Knowledge Graph Explorer</h1>
            <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
              Hero Cognitive Code Structure Visualization
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1.5 font-medium ${
            showFilters
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-gray-700 dark:text-zinc-300 hover:border-gray-300 dark:hover:border-zinc-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Options</span>
        </button>
      </div>

      {/* Top Search & Filter Drawers */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <GraphSearch query={query} onQueryChange={setQuery} />
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-semibold">
            <Sparkles className="w-3 h-3" /> Live Physics Canvas
          </span>
        </div>

        <AnimatePresence>
          {showFilters && (
            <GraphFilters
              activeType={activeType}
              onSelectType={setActiveType}
              layoutMode={layoutMode}
              onChangeLayoutMode={setLayoutMode}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Statistics Cards */}
      <GraphStatistics stats={safeDataset.stats} />

      {/* Main Graph Canvas Area + Floating Legends & Inspector Drawer */}
      <div className="relative flex flex-col md:flex-row gap-3 items-start min-h-0">
        <div className="flex-1 w-full relative">
          <GraphCanvas
            dataset={safeDataset}
            activeType={activeType}
            searchQuery={query}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />

          {/* Floating Overlay Controls: MiniMap & Legend */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 pointer-events-auto">
            <MiniMap dataset={safeDataset} />
            <GraphLegend />
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        <AnimatePresence>
          {selectedNode && (
            <InspectorDrawer node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
