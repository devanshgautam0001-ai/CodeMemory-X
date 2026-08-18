import React from 'react';
import { motion } from 'framer-motion';
import { WelcomeBanner } from './WelcomeBanner.js';
import { MemoryHealthCard } from './MemoryHealthCard.js';
import { RepositoryCard } from './RepositoryCard.js';
import { QuickActionsCard } from './QuickActionsCard.js';
import { ActivityFeedCard } from './ActivityFeedCard.js';
import { KnowledgeGraphPreviewCard } from './KnowledgeGraphPreviewCard.js';
import { RecentChangesCard } from './RecentChangesCard.js';
import { RiskPreviewCard } from './RiskPreviewCard.js';

import { SessionPanel, DriftPanel, ImpactPanel } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const DashboardView: React.FC = () => {
  const { sessionIntelligence, driftFindings, changeImpact, setActiveTab } = useDashboardStore();

  const containerVariants = {
    hidden: { opacity: 0, y: 8 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        duration: 0.25,
        ease: 'easeOut',
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <WelcomeBanner />
      </motion.div>

      {/* Live Session Intelligence & Drift Sentinel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <SessionPanel
            session={sessionIntelligence}
            onOpenTimeline={() => setActiveTab('timeline')}
            onOpenGraph={() => setActiveTab('graph')}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <DriftPanel
            findings={driftFindings}
            onAcknowledge={(id) => console.log('Acknowledge drift:', id)}
          />
        </motion.div>
      </div>

      {/* Live Structural Change Impact Section */}
      {changeImpact && (
        <motion.div variants={itemVariants}>
          <ImpactPanel impactMap={changeImpact} />
        </motion.div>
      )}

      {/* Top Grid: Health, Repository & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <MemoryHealthCard />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RepositoryCard />
        </motion.div>
        <motion.div variants={itemVariants}>
          <QuickActionsCard />
        </motion.div>
      </div>

      {/* Middle Grid: Activity Feed & Spatial Knowledge Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <ActivityFeedCard />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KnowledgeGraphPreviewCard />
        </motion.div>
      </div>

      {/* Bottom Grid: Recent Lineage Changes & Risk Sentinel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <RecentChangesCard />
        </motion.div>
        <motion.div variants={itemVariants}>
          <RiskPreviewCard />
        </motion.div>
      </div>
    </motion.div>
  );
};
