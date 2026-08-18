import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  label?: string;
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  label,
  variant = 'accent',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, value));

  const variantColors = {
    default: 'bg-text-secondary',
    accent: 'bg-accent',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <div className="flex justify-between text-xs font-mono text-text-secondary">
          <span>{label}</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-hover rounded-full overflow-hidden border border-border/30">
        <div
          className={`h-full transition-all duration-500 ease-out ${variantColors[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
