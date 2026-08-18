import React from 'react';
import { Clock, GitCommit, FileCode, CheckCircle2 } from 'lucide-react';

export const SessionTimelinePreview: React.FC = () => {
  const events = [
    { time: '10 mins ago', title: 'Adopt WASM SQLite EventStore', icon: GitCommit, type: 'decision' },
    { time: '15 mins ago', title: 'Modified DatabaseProvider.ts', icon: FileCode, type: 'file' },
    { time: '1 hour ago', title: 'Resolved node-gyp prebuild error', icon: CheckCircle2, type: 'bug' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
        <Clock className="w-3.5 h-3.5 text-cyan-500" />
        <span>Recent Session Activity</span>
      </div>

      <div className="relative pl-4 space-y-3 border-l border-gray-200 dark:border-zinc-800">
        {events.map((e, idx) => {
          const Icon = e.icon;
          return (
            <div key={idx} className="relative flex items-start gap-2.5 group">
              <div className="absolute -left-[21px] top-0.5 p-1 rounded-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-indigo-500">
                <Icon className="w-2.5 h-2.5" />
              </div>
              <div className="text-xs">
                <p className="font-medium text-gray-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {e.title}
                </p>
                <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">{e.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
