import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_TIMELINE_DATA, TimelineData, TimelineEventItem } from './mockTimeline.js';
import { TimelineHeader } from './TimelineHeader.js';
import { TimelineSearch } from './TimelineSearch.js';
import { TimelineFilters } from './TimelineFilters.js';
import { StatisticsCards } from './StatisticsCards.js';
import { Heatmap } from './Heatmap.js';
import { SessionGroup } from './SessionGroup.js';
import { TimelineDrawer } from './TimelineDrawer.js';
import { TimelineEmptyState } from './TimelineEmptyState.js';

export interface TimelineViewProps {
  data?: TimelineData;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ data: rawData }) => {
  const data = rawData || MOCK_TIMELINE_DATA;
  const sessions = data.sessions && data.sessions.length > 0 ? data.sessions : MOCK_TIMELINE_DATA.sessions;
  const stats = data.stats || MOCK_TIMELINE_DATA.stats;
  const heatmap = data.heatmap || MOCK_TIMELINE_DATA.heatmap;
  const safeData: TimelineData = {
    ...data,
    sessions,
    stats,
    heatmap,
    projectName: data.projectName || MOCK_TIMELINE_DATA.projectName,
    workspace: data.workspace || MOCK_TIMELINE_DATA.workspace,
    sessionDuration: data.sessionDuration || MOCK_TIMELINE_DATA.sessionDuration,
    currentBranch: data.currentBranch || MOCK_TIMELINE_DATA.currentBranch,
    totalMemories: data.totalMemories ?? MOCK_TIMELINE_DATA.totalMemories,
  };

  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeType, setActiveType] = useState('All');
  const [activeAuthor, setActiveAuthor] = useState('All');
  const [minImportance, setMinImportance] = useState(0.0);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEventItem | null>(null);

  const filteredSessions = useMemo(() => {
    return safeData.sessions
      .map((session) => {
        const filteredEvents = (session.events || []).filter((evt) => {
          if (activeType !== 'All' && evt.type !== activeType) return false;
          if (activeAuthor !== 'All' && evt.author !== activeAuthor) return false;
          if (evt.importance < minImportance) return false;
          if (query.trim()) {
            const q = query.toLowerCase();
            const matchTitle = evt.title.toLowerCase().includes(q);
            const matchDesc = evt.description.toLowerCase().includes(q);
            const matchAuthor = evt.author.toLowerCase().includes(q);
            const matchTags = evt.tags?.some((t) => t.toLowerCase().includes(q));
            if (!matchTitle && !matchDesc && !matchAuthor && !matchTags) return false;
          }
          return true;
        });

        return {
          ...session,
          events: filteredEvents,
        };
      })
      .filter((session) => session.events.length > 0);
  }, [safeData, query, activeType, activeAuthor, minImportance]);

  const hasEvents = filteredSessions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col h-full bg-gray-50/50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 p-4 space-y-4 overflow-y-auto font-sans select-none custom-scrollbar"
    >
      {/* Header */}
      <TimelineHeader
        projectName={safeData.projectName}
        workspace={safeData.workspace}
        sessionDuration={safeData.sessionDuration}
        currentBranch={safeData.currentBranch}
        totalMemories={safeData.totalMemories}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Search & Filters */}
      <div className="space-y-2">
        <TimelineSearch query={query} onQueryChange={setQuery} />
        <AnimatePresence>
          {showFilters && (
            <TimelineFilters
              activeType={activeType}
              onSelectType={setActiveType}
              activeAuthor={activeAuthor}
              onSelectAuthor={setActiveAuthor}
              minImportance={minImportance}
              onMinImportanceChange={setMinImportance}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards stats={safeData.stats} />

      {/* Contribution Heatmap */}
      <Heatmap data={safeData.heatmap} />

      {/* Timeline Sessions List */}
      <div className="flex-1 space-y-3 min-h-0">
        {!hasEvents ? (
          <TimelineEmptyState />
        ) : (
          filteredSessions.map((session) => (
            <SessionGroup
              key={session.sessionId}
              session={session}
              selectedEventId={selectedEvent?.id}
              onSelectEvent={setSelectedEvent}
            />
          ))
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedEvent && (
          <TimelineDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
