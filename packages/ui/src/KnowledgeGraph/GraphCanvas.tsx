import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GraphDataset, GraphNodeData } from './mockKnowledgeGraph.js';
import { GraphNode } from './GraphNode.js';
import { GraphEdge } from './GraphEdge.js';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

export interface GraphCanvasProps {
  dataset: GraphDataset;
  activeType: string;
  searchQuery: string;
  selectedNode: GraphNodeData | null;
  onSelectNode: (node: GraphNodeData) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  dataset,
  activeType,
  searchQuery,
  selectedNode,
  onSelectNode,
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName !== 'DIV') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(0.4, Math.min(2.5, prev + delta)));
  };

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-[550px] rounded-3xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/60 backdrop-blur-xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing select-none"
    >
      {/* Zoom / Pan Controls Overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-lg text-xs">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300"
          title="Center Graph"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <span className="font-mono text-[10px] text-gray-400 dark:text-zinc-500 px-1 font-semibold">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Main Canvas Transform Layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
        className="w-full h-full relative transition-transform duration-75 ease-out pointer-events-none"
      >
        {/* SVG Edges Layer */}
        <svg className="w-[1200px] h-[800px] absolute inset-0">
          {dataset.edges.map((edge) => {
            const sourceNode = dataset.nodes.find((n) => n.id === edge.source);
            const targetNode = dataset.nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <GraphEdge
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
              />
            );
          })}
        </svg>

        {/* Nodes Interactive Layer */}
        <div className="w-[1200px] h-[800px] absolute inset-0 pointer-events-auto">
          {dataset.nodes.map((node) => {
            const isTypeFiltered = activeType !== 'All' && node.type !== activeType;
            const isMatch =
              searchQuery.trim() !== '' &&
              (node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.summary.toLowerCase().includes(searchQuery.toLowerCase()));

            const isFaded = isTypeFiltered || (searchQuery.trim() !== '' && !isMatch);

            return (
              <GraphNode
                key={node.id}
                node={node}
                isSelected={selectedNode?.id === node.id}
                isMatch={isMatch}
                isFaded={isFaded}
                onSelect={onSelectNode}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
