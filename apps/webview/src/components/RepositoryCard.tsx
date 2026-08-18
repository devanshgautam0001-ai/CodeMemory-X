import React from 'react';
import { GitBranch, Code2, FileCheck, Clock } from 'lucide-react';
import { Card, Badge } from '@codememory/ui';

export const RepositoryCard: React.FC = () => {
  return (
    <Card
      title="Active Repository Memory"
      subtitle="Git workspace & AST identity tracking"
      action={<Badge variant="accent">CodeMemory X</Badge>}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-hover/40 border border-border/50">
          <div className="flex items-center space-x-2.5">
            <GitBranch size={16} className="text-accent" />
            <div>
              <div className="text-xs font-semibold text-text-primary">feature/auth-refactor</div>
              <div className="text-[10px] font-mono text-text-secondary">Head: a7f8b9d • 2m ago</div>
            </div>
          </div>
          <Badge variant="default">Clean Working Tree</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded bg-hover/20 flex items-center space-x-2">
            <Code2 size={14} className="text-purple-400" />
            <div>
              <span className="text-[10px] text-text-secondary block">Tracked AST Symbols</span>
              <span className="font-semibold text-text-primary">14 Active Nodes</span>
            </div>
          </div>
          <div className="p-2 rounded bg-hover/20 flex items-center space-x-2">
            <FileCheck size={14} className="text-emerald-400" />
            <div>
              <span className="text-[10px] text-text-secondary block">Bound Decisions</span>
              <span className="font-semibold text-text-primary">3 ADRs Linked</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
