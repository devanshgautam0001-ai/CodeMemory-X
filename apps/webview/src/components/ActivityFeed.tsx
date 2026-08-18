import React from 'react';
import { MemoryExplorer } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const ActivityFeed: React.FC = () => {
  const { memories } = useDashboardStore();

  return (
    <div className="h-full w-full">
      <MemoryExplorer initialMemories={memories.length > 0 ? memories : undefined} />
    </div>
  );
};
