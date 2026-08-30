import React from 'react';
import { ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Card, Badge } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const RiskPreviewCard: React.FC = () => {
  const { setActiveTab } = useDashboardStore();

  return (
    <Card
      title="Architectural Drift & Risk Sentinel"
      subtitle="Pre-commit bug immunity & decision compliance checks"
      action={
        <button onClick={() => setActiveTab('graph')} className="cursor-pointer">
          <Badge variant="success">0 Critical Risks</Badge>
        </button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
          <ShieldCheck size={18} className="shrink-0" />
          <div>
            <div className="font-semibold">Bug Immunity Active</div>
            <div className="text-[10px] opacity-80">Zero historical regressions detected in uncommitted diffs.</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono p-2 rounded bg-hover/30 border border-border/40">
          <div className="flex items-center space-x-2">
            <AlertCircle size={14} className="text-amber-400" />
            <span className="text-text-primary text-[11px]">Architectural Rule Check</span>
          </div>
          <span className="text-amber-400 text-[10px]">1 Boundary Note</span>
        </div>
      </div>
    </Card>
  );
};
