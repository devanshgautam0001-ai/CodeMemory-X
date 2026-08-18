import React from 'react';

export interface BadgeProps {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  const styles = {
    default: 'bg-hover text-text-secondary border-border',
    accent: 'bg-accent/15 text-accent border-accent/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[variant]}`}>
      {children}
    </span>
  );
};
