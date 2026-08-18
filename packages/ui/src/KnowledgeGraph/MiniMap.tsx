import React from 'react';
import { GraphDataset } from './mockKnowledgeGraph.js';

export const MiniMap: React.FC<{ dataset: GraphDataset }> = ({ dataset }) => {
  return (
    <div className="w-28 h-20 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 relative shadow-md overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 800 600">
        {dataset.edges.map((e) => {
          const s = dataset.nodes.find((n) => n.id === e.source);
          const t = dataset.nodes.find((n) => n.id === e.target);
          if (!s || !t) return null;
          return <line key={e.id} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="rgba(129, 140, 248, 0.4)" strokeWidth="4" />;
        })}
        {dataset.nodes.map((n) => (
          <circle key={n.id} cx={n.x} cy={n.y} r="18" fill="#818cf8" />
        ))}
      </svg>
    </div>
  );
};
