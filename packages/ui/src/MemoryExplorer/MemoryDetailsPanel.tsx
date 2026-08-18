import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryItem } from './mockMemories.js';
import { DecisionPanel } from './DecisionPanel.js';
import { BugPanel } from './BugPanel.js';
import { RefactorPanel } from './RefactorPanel.js';
import { RelationshipPanel } from './RelationshipPanel.js';
import { SessionTimelinePreview } from './SessionTimelinePreview.js';
import { Info, Network, Clock, X, Zap } from 'lucide-react';

export interface MemoryDetailsPanelProps {
  item: MemoryItem | null;
  onClose: () => void;
  onSelectRelated: (targetId: string) => void;
}

export const MemoryDetailsPanel: React.FC<MemoryDetailsPanelProps> = ({
  item,
  onClose,
  onSelectRelated,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'relationships' | 'sessions'>('details');

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="p-4 rounded-2xl border border-gray-200/90 dark:border-zinc-800/90 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xl space-y-3"
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-zinc-800/80 pb-3">
        <div>
          <span className="px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-wider rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1 inline-block">
            {item.type} memory
          </span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{item.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-zinc-800/60 text-xs">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'details'
              ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
        <button
          onClick={() => setActiveTab('relationships')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'relationships'
              ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Relations ({item.relationships.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
            activeTab === 'sessions'
              ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm'
              : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Sessions</span>
        </button>
      </div>

      {/* Tab Body */}
      <AnimatePresence mode="wait">
        {activeTab === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            <p className="text-xs text-gray-700 dark:text-zinc-300 leading-relaxed bg-gray-50/70 dark:bg-zinc-900/50 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
              {item.summary}
            </p>

            {item.type === 'decision' && item.details && <DecisionPanel details={item.details} />}
            {item.type === 'bug' && item.details && <BugPanel details={item.details} />}
            {item.type === 'refactor' && item.details && <RefactorPanel details={item.details} />}

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-1">
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                  Confidence
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.round(item.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-800 dark:text-zinc-200">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-1">
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-semibold uppercase tracking-wider block">
                  Importance
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.round(item.importance * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-gray-800 dark:text-zinc-200">
                    {Math.round(item.importance * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {item.sourceEvents && item.sourceEvents.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 text-[11px]">
                <span className="text-gray-400 dark:text-zinc-500 flex items-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-amber-500" /> Derived Source Events:
                </span>
                <div className="flex flex-wrap gap-1">
                  {item.sourceEvents.map((evtId) => (
                    <span
                      key={evtId}
                      className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-mono text-[10px]"
                    >
                      {evtId}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'relationships' && (
          <motion.div
            key="relationships"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <RelationshipPanel relationships={item.relationships} onSelectRelated={onSelectRelated} />
          </motion.div>
        )}

        {activeTab === 'sessions' && (
          <motion.div
            key="sessions"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            <SessionTimelinePreview />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
