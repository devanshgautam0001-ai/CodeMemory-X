import React from 'react';
import { TimelineView } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const MemoryTimelineView: React.FC = () => {
  const { timelineData } = useDashboardStore();

  return (
    <div className="h-full w-full">
      <TimelineView data={timelineData ?? undefined} />
    </div>
  );
};
