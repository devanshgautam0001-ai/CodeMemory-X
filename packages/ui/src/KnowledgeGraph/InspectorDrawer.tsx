import React from 'react';
import { motion } from 'framer-motion';
import { GraphNodeData } from './mockKnowledgeGraph.js';
import { X, Network, FileCode, Clock, ShieldAlert, CheckCircle, User, Zap } from 'lucide-react';

export interface InspectorDrawerProps {
  node: GraphNodeData | null;
  onClose: () => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ node, onClose }) => {
  if (!node) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full sm:w-80 p-4 rounded-2xl border border-gray-200/90 dark:border-zinc-800/90 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl space-y-3"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
        <div>
          <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1 inline-block">
            {node.type} node
          </span>
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-zinc-100">{node.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50/70 dark:bg-zinc-950/60 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 font-medium">
        {node.summary}
      </p>

      {node.details?.filePath && (
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-600 dark:text-zinc-400 truncate">
          <FileCode className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
          <span className="truncate">{node.details.filePath}</span>
        </div>
      )}

      {node.details?.rationale && (
        <div className="p-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs space-y-1">
          <span className="font-bold text-purple-700 dark:text-purple-300 block">Decision Rationale</span>
          <p className="text-gray-700 dark:text-zinc-300 leading-relaxed">{node.details.rationale}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 space-y-1">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Risk Score</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(node.riskScore * 100)}%</span>
        </div>
        <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 space-y-1">
          <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Confidence</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{Math.round(node.confidence * 100)}%</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 text-[11px] font-mono text-gray-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Last Edit:</span>
          <span className="text-gray-800 dark:text-zinc-200">{node.lastModified}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Changes Count:</span>
          <span className="text-gray-800 dark:text-zinc-200">{node.changesCount} commits</span>
        </div>
      </div>
    </motion.div>
  );
};
