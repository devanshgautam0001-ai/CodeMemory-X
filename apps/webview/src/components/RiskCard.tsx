import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmptyState, Card } from '@codememory/ui';

export const RiskCard: React.FC = () => {
  return (
    <Card title="Risk Prediction Sentinel" subtitle="Pre-commit regression and architectural drift monitor">
      <EmptyState
        icon={<AlertTriangle size={24} />}
        title="Zero High-Risk Edits Flagged"
        description="Uncommitted changes will be evaluated against past bug fix records and architectural decision constraints."
      />
    </Card>
  );
};
