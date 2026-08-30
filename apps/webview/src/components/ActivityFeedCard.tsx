import React from 'react';
import { Activity, Terminal, FileCode, MessageSquare, CheckCircle } from 'lucide-react';
import { Card, Badge } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const ActivityFeedCard: React.FC = () => {
  const { setActiveTab } = useDashboardStore();

  const activities = [
    {
      id: '1',
      time: '19:14',
      type: 'AST_MUTATION',
      icon: <FileCode size={14} className="text-accent" />,
      title: 'Modified validateToken() signature',
      details: 'Added rate limiting guard clause in auth/service.ts (+14 lines)',
      badge: <Badge variant="accent">AST Diff</Badge>,
    },
    {
      id: '2',
      time: '19:10',
      type: 'TERMINAL_TEST',
      icon: <Terminal size={14} className="text-emerald-400" />,
      title: 'npm test auth.service.spec.ts',
      details: 'Suite passed cleanly (12 tests, 142ms)',
      badge: <Badge variant="success">Passed</Badge>,
    },
    {
      id: '3',
      time: '18:55',
      type: 'AI_INTENT',
      icon: <MessageSquare size={14} className="text-purple-400" />,
      title: 'Copilot Chat Ingest',
      details: '"How to prevent timing attacks in JWT verification?"',
      badge: <Badge variant="default">AI Rationale</Badge>,
    },
  ];

  return (
    <Card
      title="Sub-conscious Telemetry Stream"
      subtitle="Passive background micro-actions capture"
      action={
        <button onClick={() => setActiveTab('activity')} className="cursor-pointer">
          <Badge variant="default">Live Stream</Badge>
        </button>
      }
    >
      <div className="space-y-3 mt-1">
        {activities.map((item) => (
          <div
            key={item.id}
            className="flex items-start space-x-3 p-2.5 rounded-lg bg-hover/30 hover:bg-hover/60 transition-all border border-border/40"
          >
            <div className="p-1.5 rounded bg-background border border-border/50 mt-0.5">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-text-primary truncate">{item.title}</h4>
                {item.badge}
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed truncate">
                {item.details}
              </p>
              <span className="text-[9px] font-mono text-text-secondary/70 block mt-1">
                {item.time} • Automatic Telemetry Capture
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
