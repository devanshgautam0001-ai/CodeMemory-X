import React from 'react';
import { GitCommit, Plus, Minus, FileCode } from 'lucide-react';
import { Card, Badge } from '@codememory/ui';
import { useDashboardStore } from '../store/useDashboardStore.js';

export const RecentChangesCard: React.FC = () => {
  const { setActiveTab } = useDashboardStore();

  const changes = [
    {
      id: 'c1',
      file: 'src/auth/service.ts',
      symbol: 'validateToken()',
      changeType: 'GUARD_CLAUSE_ADDITION',
      added: 14,
      deleted: 2,
    },
    {
      id: 'c2',
      file: 'src/auth/jwt.ts',
      symbol: 'verifySignature()',
      changeType: 'REFACTOR_MOVE',
      added: 8,
      deleted: 8,
    },
  ];

  return (
    <Card title="Recent Symbol Lineage Mutations" subtitle="AST-level code changes">
      <div className="space-y-2.5 mt-1">
        {changes.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveTab('story')}
            className="flex items-center justify-between p-2 rounded-lg bg-hover/20 border border-border/40 text-xs font-mono cursor-pointer hover:border-accent/40 transition-all"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <FileCode size={14} className="text-accent shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-text-primary">{c.symbol}</span>
                <span className="text-text-secondary text-[10px] block truncate">{c.file}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-emerald-400 flex items-center text-[10px]">
                <Plus size={10} />
                {c.added}
              </span>
              <span className="text-rose-400 flex items-center text-[10px]">
                <Minus size={10} />
                {c.deleted}
              </span>
              <Badge variant="default">{c.changeType}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
