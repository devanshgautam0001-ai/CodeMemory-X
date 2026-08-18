import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, action, className = '' }) => {
  return (
    <div className={`bg-card-bg border border-border rounded-lg p-4 shadow-sm backdrop-blur-sm transition-all hover:border-accent/40 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
          <div>
            {title && <h3 className="text-sm font-semibold text-text-primary tracking-wide">{title}</h3>}
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
};
