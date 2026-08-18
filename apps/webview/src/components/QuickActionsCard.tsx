import React from 'react';
import { FilePlus2, BookOpen, ShieldAlert, Share2 } from 'lucide-react';
import { Card, Button } from '@codememory/ui';

export const QuickActionsCard: React.FC = () => {
  return (
    <Card title="Quick Intent Actions" subtitle="Record decisions and reconstruct code lineage">
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Button variant="secondary" size="sm" className="justify-start space-x-2 text-xs">
          <FilePlus2 size={14} className="text-accent" />
          <span>Record ADR</span>
        </Button>
        <Button variant="secondary" size="sm" className="justify-start space-x-2 text-xs">
          <BookOpen size={14} className="text-purple-400" />
          <span>Symbol Story</span>
        </Button>
        <Button variant="secondary" size="sm" className="justify-start space-x-2 text-xs">
          <ShieldAlert size={14} className="text-amber-400" />
          <span>Scan Risk</span>
        </Button>
        <Button variant="secondary" size="sm" className="justify-start space-x-2 text-xs">
          <Share2 size={14} className="text-emerald-400" />
          <span>Export Intent</span>
        </Button>
      </div>
    </Card>
  );
};
