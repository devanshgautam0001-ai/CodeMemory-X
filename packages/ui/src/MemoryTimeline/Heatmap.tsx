import React from 'react';
import { TimelineData } from './mockTimeline.js';
import { Activity } from 'lucide-react';

export const Heatmap: React.FC<{ data: TimelineData['heatmap'] }> = ({ data }) => {
  return (
    <div className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md space-y-2 text-xs shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-zinc-200">
          <Activity className="w-3.5 h-3.5 text-purple-500" />
          <span>Cognitive Activity Heatmap</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">Last 7 Days</span>
      </div>

      <div className="flex items-center justify-between gap-1.5 pt-1">
        {data.map((item, idx) => {
          const intensity =
            item.count > 20 ? 'bg-purple-600 dark:bg-purple-500' : item.count > 10 ? 'bg-purple-400 dark:bg-purple-600' : 'bg-purple-200 dark:bg-purple-900/60';

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-8 rounded-lg ${intensity} transition-all hover:scale-105 cursor-pointer shadow-sm`}
                title={`${item.date}: ${item.count} events`}
              />
              <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500">
                {item.date.split('-')[2]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
