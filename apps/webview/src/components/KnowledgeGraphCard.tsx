import React from 'react';
import { KnowledgeGraphView } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const KnowledgeGraphCard: React.FC = () => {
  const { knowledgeGraph } = useDashboardStore();

  return (
    <div className="h-full w-full">
      <KnowledgeGraphView dataset={knowledgeGraph ?? undefined} />
    </div>
  );
};
