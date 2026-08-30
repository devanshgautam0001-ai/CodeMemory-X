import React from 'react';
import { Network, Maximize2 } from 'lucide-react';
import { Card, Badge, Button } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const KnowledgeGraphPreviewCard: React.FC = () => {
  const { setActiveTab } = useDashboardStore();

  return (
    <Card
      title="Knowledge Graph Spatial Topology"
      subtitle="CodeSymbol, DecisionNode & BugImmunity Edges"
      action={
        <Button variant="ghost" size="sm" onClick={() => setActiveTab('graph')}>
          <Maximize2 size={14} />
        </Button>
      }
    >
      <div
        onClick={() => setActiveTab('graph')}
        className="relative w-full h-44 rounded-lg bg-hover/20 border border-border/50 p-4 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent/50 transition-all"
      >
        {/* Animated Spatial Node Mesh Mock */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <line x1="20%" y1="30%" x2="50%" y2="50%" stroke="var(--vscode-focusBorder)" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="50%" y1="50%" x2="80%" y2="40%" stroke="var(--vscode-focusBorder)" strokeWidth="1.5" />
          <line x1="50%" y1="50%" x2="40%" y2="80%" stroke="#a855f7" strokeWidth="1.5" />
          <line x1="80%" y1="40%" x2="75%" y2="80%" stroke="#10b981" strokeWidth="1.5" />
        </svg>

        {/* Nodes */}
        <div className="absolute left-[20%] top-[30%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 bg-card-bg px-2 py-1 rounded border border-accent/40 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
          <span className="text-[10px] font-mono text-text-primary">validateToken</span>
        </div>

        <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 bg-card-bg px-2.5 py-1.5 rounded-lg border border-accent shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-xs font-mono font-bold text-text-primary">AuthService</span>
        </div>

        <div className="absolute left-[80%] top-[40%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 bg-card-bg px-2 py-1 rounded border border-emerald-500/40 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] font-mono text-text-primary">JWTVerifier</span>
        </div>

        <div className="absolute left-[40%] top-[80%] -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1 bg-card-bg px-2 py-1 rounded border border-purple-500/40 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-[10px] font-mono text-text-primary">ADR-003: TimingFix</span>
        </div>

        <div className="absolute right-3 bottom-3">
          <Badge variant="accent">3-Hop Subgraph</Badge>
        </div>
      </div>
    </Card>
  );
};
