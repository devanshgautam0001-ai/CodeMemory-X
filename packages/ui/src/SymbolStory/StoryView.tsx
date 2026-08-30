import React from 'react';
import { motion } from 'framer-motion';
import { MOCK_SYMBOL_STORY, SymbolStoryData } from './mockSymbolStory.js';
import { StoryHeader } from './StoryHeader.js';
import { StoryBirth } from './StoryBirth.js';
import { StoryTimeline } from './StoryTimeline.js';
import { StoryContributors } from './StoryContributors.js';
import { StoryDecisions } from './StoryDecisions.js';
import { StoryBugs } from './StoryBugs.js';
import { StoryGraphPreview } from './StoryGraphPreview.js';
import { StoryMetrics } from './StoryMetrics.js';
import { StoryAiPlaceholder } from './StoryAiPlaceholder.js';
import { BookOpen } from 'lucide-react';

export interface StoryViewProps {
  story?: SymbolStoryData;
}

export const StoryView: React.FC<StoryViewProps> = ({ story: rawStory }) => {
  const story = rawStory || MOCK_SYMBOL_STORY;
  const safeStory: SymbolStoryData = {
    ...story,
    symbol: story.symbol || MOCK_SYMBOL_STORY.symbol,
    birth: story.birth || MOCK_SYMBOL_STORY.birth,
    evolution: story.evolution || MOCK_SYMBOL_STORY.evolution,
    contributors: story.contributors || MOCK_SYMBOL_STORY.contributors,
    decisions: story.decisions || MOCK_SYMBOL_STORY.decisions,
    bugs: story.bugs || MOCK_SYMBOL_STORY.bugs,
    dependencies: story.dependencies || MOCK_SYMBOL_STORY.dependencies,
    metrics: story.metrics || MOCK_SYMBOL_STORY.metrics,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 p-4 space-y-4 overflow-y-auto font-sans select-none custom-scrollbar"
    >
      {/* Title Bar */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200/60 dark:border-zinc-800/60">
        <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-md shadow-purple-500/20">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xs font-extrabold tracking-tight">Symbol Story Inspector</h1>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">CodeMemory X • Code Evolution Memory</p>
        </div>
      </div>

      {/* Header Info */}
      <StoryHeader symbol={safeStory.symbol} />

      {/* Birth Story */}
      <StoryBirth birth={safeStory.birth} />

      {/* Metrics */}
      <StoryMetrics metrics={safeStory.metrics} />

      {/* Timeline */}
      <StoryTimeline evolution={safeStory.evolution} />

      {/* Contributors */}
      <StoryContributors contributors={safeStory.contributors} />

      {/* ADR Decisions */}
      <StoryDecisions decisions={safeStory.decisions} />

      {/* Bugs */}
      <StoryBugs bugs={safeStory.bugs} />

      {/* Dependency Graph Preview */}
      <StoryGraphPreview dependencies={safeStory.dependencies} />

      {/* AI Prediction Placeholder */}
      <StoryAiPlaceholder />
    </motion.div>
  );
};
