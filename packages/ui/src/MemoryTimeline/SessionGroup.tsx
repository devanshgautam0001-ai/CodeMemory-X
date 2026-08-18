import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionData, TimelineEventItem } from './mockTimeline.js';
import { TimelineCard } from './TimelineCard.js';
import { Clock, ChevronDown, FileCode, Code2, GitCommit, Bug } from 'lucide-react';

export interface SessionGroupProps {
  session: SessionData;
  selectedEventId?: string;
  onSelectEvent: (event: TimelineEventItem) => void;
}

export const SessionGroup: React.FC<SessionGroupProps> = ({
  session,
  selectedEventId,
  onSelectEvent,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-2">
      {/* Session Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-3 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm hover:border-purple-500/30 cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
              {session.title}
            </h3>
            <p className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">
              {session.startTime} - {session.endTime} ({session.duration})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-gray-500 dark:text-zinc-400">
            <span className="flex items-center gap-0.5">
              <FileCode className="w-3 h-3 text-blue-500" /> {session.filesChanged}
            </span>
            <span className="flex items-center gap-0.5">
              <Code2 className="w-3 h-3 text-emerald-500" /> {session.symbolsTouched}
            </span>
            <span className="flex items-center gap-0.5">
              <GitCommit className="w-3 h-3 text-purple-500" /> {session.decisionsMade}
            </span>
            <span className="flex items-center gap-0.5">
              <Bug className="w-3 h-3 text-rose-500" /> {session.bugsFixed}
            </span>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Session Timeline Events List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pl-4 border-l-2 border-cyan-500/30 ml-3"
          >
            {session.events.map((event) => (
              <TimelineCard
                key={event.id}
                event={event}
                isSelected={selectedEventId === event.id}
                onSelect={onSelectEvent}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
