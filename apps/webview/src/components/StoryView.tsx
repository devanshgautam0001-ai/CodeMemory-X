import React from 'react';
import { StoryView as UIStoryView } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const StoryView: React.FC = () => {
  const { symbolStory } = useDashboardStore();

  return (
    <div className="h-full w-full">
      <UIStoryView story={symbolStory ?? undefined} />
    </div>
  );
};
