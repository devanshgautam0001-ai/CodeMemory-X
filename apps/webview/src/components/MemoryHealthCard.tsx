import React from 'react';
import { Database, CheckCircle2, HardDrive } from 'lucide-react';
import { Card, Progress, Badge } from '@codememory/ui';

export const MemoryHealthCard: React.FC = () => {
  return (
    <Card
      title="Memory Layer Health"
      subtitle="SQLite transactional WAL & DuckDB analytics engine"
      action={<Badge variant="success">98.4% Optimal</Badge>}
    >
      <div className="space-y-4">
        <Progress value={98} label="Memory Index Integrity" variant="success" />

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/40 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Database size={14} className="text-accent" />
            <div>
              <div className="text-text-secondary text-[10px]">Memory Atoms</div>
              <div className="font-semibold text-text-primary">1,248 Indexed</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <HardDrive size={14} className="text-purple-400" />
            <div>
              <div className="text-text-secondary text-[10px]">Disk Storage</div>
              <div className="font-semibold text-text-primary">14.2 MB / 500 MB</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1">
          <span className="flex items-center space-x-1 text-emerald-400">
            <CheckCircle2 size={12} />
            <span>Zero Lost Context</span>
          </span>
          <span className="font-mono text-[10px]">WAL Sync Latency: 2.1ms</span>
        </div>
      </div>
    </Card>
  );
};
