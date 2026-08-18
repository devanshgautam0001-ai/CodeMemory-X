import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GraphNodeData } from './mockKnowledgeGraph.js';
import {
  FileCode,
  Code2,
  GitCommit,
  Bug,
  GitPullRequest,
  Clock,
  User,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

const NODE_CONFIG: Record<string, { icon: React.ElementType; color: string; border: string; glow: string }> = {
  File: { icon: FileCode, color: 'text-blue-500 bg-blue-500/10', border: 'border-blue-500/40', glow: 'shadow-blue-500/20' },
  Class: { icon: Code2, color: 'text-purple-500 bg-purple-500/10', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
  Function: { icon: Code2, color: 'text-amber-500 bg-amber-500/10', border: 'border-amber-500/40', glow: 'shadow-amber-500/20' },
  Interface: { icon: Layers, color: 'text-cyan-500 bg-cyan-500/10', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/20' },
  Enum: { icon: Layers, color: 'text-emerald-500 bg-emerald-500/10', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20' },
  Namespace: { icon: Layers, color: 'text-indigo-500 bg-indigo-500/10', border: 'border-indigo-500/40', glow: 'shadow-indigo-500/20' },
  Package: { icon: Package, color: 'text-teal-500 bg-teal-500/10', border: 'border-teal-500/40', glow: 'shadow-teal-500/20' },
  Bug: { icon: Bug, color: 'text-rose-500 bg-rose-500/10', border: 'border-rose-500/40', glow: 'shadow-rose-500/20' },
  ADR: { icon: GitCommit, color: 'text-purple-500 bg-purple-500/10', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
  Refactor: { icon: GitPullRequest, color: 'text-amber-500 bg-amber-500/10', border: 'border-amber-500/40', glow: 'shadow-amber-500/20' },
  Session: { icon: Clock, color: 'text-cyan-500 bg-cyan-500/10', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/20' },
  Developer: { icon: User, color: 'text-pink-500 bg-pink-500/10', border: 'border-pink-500/40', glow: 'shadow-pink-500/20' },
};

export interface GraphNodeProps {
  node: GraphNodeData;
  isSelected: boolean;
  isMatch: boolean;
  isFaded: boolean;
  onSelect: (node: GraphNodeData) => void;
}

export const GraphNode: React.FC<GraphNodeProps> = ({
  node,
  isSelected,
  isMatch,
  isFaded,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.File;
  const Icon = cfg.icon;

  return (
    <motion.div
      style={{ left: `${node.x}px`, top: `${node.y}px` }}
      initial={{ scale: 0 }}
      animate={{ scale: isFaded ? 0.6 : 1, opacity: isFaded ? 0.35 : 1 }}
      whileHover={{ scale: 1.12, zIndex: 50 }}
      onClick={() => onSelect(node)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ${
        isMatch ? 'ring-4 ring-indigo-500/60 rounded-full' : ''
      }`}
    >
      {/* Node Ring & Container */}
      <div
        className={`relative p-2.5 rounded-full border backdrop-blur-xl shadow-lg transition-all flex items-center justify-center ${cfg.color} ${cfg.border} ${
          isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-zinc-950 scale-110 shadow-xl' : cfg.glow
        }`}
      >
        <Icon className="w-4 h-4" />

        {/* Importance Indicator Ring Dot */}
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white dark:border-zinc-950"
          title={`Importance: ${Math.round(node.importance * 100)}%`}
        />
      </div>

      {/* Label Badge */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap pointer-events-none">
        <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md border border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md text-gray-900 dark:text-zinc-100 shadow-sm">
          {node.label}
        </span>
      </div>

      {/* Hover Card Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-xl border border-gray-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl text-xs shadow-xl z-50 pointer-events-none space-y-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-semibold uppercase text-indigo-500">{node.type}</span>
            <span className="text-[9px] font-mono text-gray-400">{node.lastModified}</span>
          </div>
          <p className="text-[11px] font-medium text-gray-800 dark:text-zinc-200 line-clamp-2">{node.summary}</p>
          <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-zinc-400 pt-1 border-t border-gray-100 dark:border-zinc-800">
            <span>Risk: {Math.round(node.riskScore * 100)}%</span>
            <span>Conf: {Math.round(node.confidence * 100)}%</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
