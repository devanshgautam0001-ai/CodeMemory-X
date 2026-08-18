import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border/60 bg-card-bg/30">
      {icon && <div className="p-3 bg-hover rounded-full mb-3 text-accent">{icon}</div>}
      <h4 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h4>
      <p className="text-xs text-text-secondary max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
